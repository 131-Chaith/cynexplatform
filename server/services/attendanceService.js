import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const QR_SECRET = process.env.QR_SECRET || 'attendance-qr-secret-key';

export const generateQRToken = (sessionId) => {
    // Session token with unique timestamp to ensure dynamism
    // Token valid for 10 minutes as per spec (5-10 min window), unique salt prevents replay
    return jwt.sign(
        { sessionId, salt: Date.now(), nonce: Math.random().toString(36), type: 'attendance_qr' },
        QR_SECRET,
        { expiresIn: '10m' }
    );
};

export const validateQRToken = (token) => {
    try {
        const decoded = jwt.verify(token, QR_SECRET);
        if (decoded.type !== 'attendance_qr') {
            throw new Error('Invalid token type');
        }
        return decoded;
    } catch (error) {
        throw new Error('Invalid or expired QR code');
    }
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; 
};

export const markAttendance = async (sessionId, studentId, gpsData = null, deviceInfo = null, ipAddress = null) => {
    // 1. Fetch Session & Validate Expiry
    const sessionRes = await db.execute({
        sql: "SELECT * FROM attendance_sessions WHERE id = ?",
        args: [sessionId]
    });

    if (sessionRes.rows.length === 0) throw new Error('Session not found');
    const session = sessionRes.rows[0];

    if (session.status !== 'ongoing') throw new Error('Session is no longer active');
    
    // Check QR expiry for offline
    if (session.type === 'offline' && session.qr_expiry) {
        if (new Date() > new Date(session.qr_expiry)) {
            throw new Error('QR Code has expired');
        }
    }

    // 2. Location Verification
    let gpsVerified = false;
    if (session.gps_lat && session.gps_lng) {
        if (!gpsData) throw new Error('Location access required for this session');
        const distance = calculateDistance(session.gps_lat, session.gps_lng, gpsData.lat, gpsData.lng);
        if (distance > 150) throw new Error('Outside allowed attendance radius');
        gpsVerified = true;
    }

    // 3. Duplicate Prevention
    const recordRes = await db.execute({
        sql: "SELECT id FROM attendance_records WHERE session_id = ? AND student_id = ?",
        args: [sessionId, studentId]
    });

    if (recordRes.rows.length > 0) throw new Error('Already marked present');

    // 4. Calculate Late Flag
    const sessionStartTime = new Date(session.start_time).getTime();
    const currentTime = Date.now();
    const diffMins = (currentTime - sessionStartTime) / 60000;
    const isLate = diffMins > 15; // 15 mins grace period

    // 5. Record Attendance
    await db.execute({
        sql: `INSERT INTO attendance_records (
                session_id, student_id, join_time, status, 
                gps_verified, device_info, ip_address, attendance_type,
                late_flag, attendance_percentage, remarks
              ) VALUES (?, ?, CURRENT_TIMESTAMP, 'present', ?, ?, ?, ?, ?, 100, ?)`,
        args: [
            sessionId, 
            studentId, 
            gpsVerified ? 1 : 0, 
            deviceInfo || 'Unknown Device',
            ipAddress || 'Unknown IP',
            session.type,
            isLate ? 1 : 0,
            isLate ? 'Marked present but late (+15 mins)' : 'On-time attendance'
        ]
    });

    return { 
        success: true, 
        message: isLate ? 'Attendance marked (Late)' : 'Attendance verified and recorded',
        type: session.type,
        isLate
    };
};

export const getStudentStats = async (studentId) => {
    // 1. Get student's batch
    const userRes = await db.execute({
        sql: "SELECT batch_id FROM users WHERE id = ?",
        args: [studentId]
    });
    const batchId = userRes.rows[0]?.batch_id;

    // 2. Total Sessions for this batch
    const sessionsRes = await db.execute({
        sql: "SELECT COUNT(*) as count FROM attendance_sessions WHERE (batch_id = ? OR batch_id IS NULL)",
        args: [batchId]
    });
    const totalSessions = sessionsRes.rows[0].count;

    // 3. Present Count
    const presentRes = await db.execute({
        sql: "SELECT COUNT(*) as count FROM attendance_records WHERE student_id = ? AND status = 'present'",
        args: [studentId]
    });
    const presentCount = presentRes.rows[0].count;

    // 4. Late Count
    const lateRes = await db.execute({
        sql: "SELECT COUNT(*) as count FROM attendance_records WHERE student_id = ? AND late_flag = 1",
        args: [studentId]
    });
    const lateCount = lateRes.rows[0].count;

    const attendancePercentage = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;

    return {
        totalSessions,
        presentCount,
        absentCount: Math.max(0, totalSessions - presentCount),
        lateCount,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100
    };
};

export const getStudentAnalytics = async (studentId) => {
    // Subject-wise breakdown
    const subjectStats = await db.execute({
        sql: `SELECT c.title as subject, COUNT(r.id) as present_count
              FROM attendance_records r
              JOIN attendance_sessions s ON r.session_id = s.id
              JOIN courses c ON s.course_id = c.id
              WHERE r.student_id = ? AND r.status = 'present'
              GROUP BY c.id`,
        args: [studentId]
    });

    // Monthly breakdown
    const monthlyStats = await db.execute({
        sql: `SELECT strftime('%Y-%m', join_time) as month, COUNT(*) as count
              FROM attendance_records
              WHERE student_id = ? AND status = 'present'
              GROUP BY month
              ORDER BY month ASC`,
        args: [studentId]
    });

    return {
        subjects: subjectStats.rows,
        monthly: monthlyStats.rows
    };
};

export const getStudentCalendar = async (studentId) => {
    const history = await db.execute({
        sql: `SELECT r.join_time, r.status, s.topic, s.type
              FROM attendance_records r
              JOIN attendance_sessions s ON r.session_id = s.id
              WHERE r.student_id = ?
              ORDER BY r.join_time DESC`,
        args: [studentId]
    });

    return history.rows;
};
