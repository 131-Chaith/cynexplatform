import express from 'express';
import { db } from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';
import { generateQRToken, validateQRToken, markAttendance, getStudentStats, getStudentAnalytics, getStudentCalendar } from '../services/attendanceService.js';
import { pullMeetAttendance, getSessionReport, createMeetSession } from '../services/googleMeetService.js';
import { getAuthUrl, saveTokens } from '../services/googleAuthService.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';


const router = express.Router();

// --- Session Management (Admin/Instructor) ---
// Generate a Google Meet link on-the-fly
router.get('/generate-meet', authenticateToken, authorizeRole('admin', 'instructor'), async (req, res) => {
    try {
        const topic = req.query.topic || 'New Class Session';
        const start = req.query.start || new Date().toISOString();
        const duration = parseInt(req.query.duration) || 60;
        
        try {
            const meetData = await createMeetSession(req.user.id, topic, start, duration);
            res.json(meetData);
        } catch (innerError) {
            console.warn("Meet API Error:", innerError.message);
            // Fallback for demo/dev purposes
            const part1 = Math.random().toString(36).substring(2, 5);
            const part2 = Math.random().toString(36).substring(2, 6);
            const part3 = Math.random().toString(36).substring(2, 5);
            const fallbackLink = `https://meet.jit.si/CynexClassroom-${part1}${part2}${part3}`;
            
            res.json({ 
                meetLink: fallbackLink, 
                isFallback: true, 
                errorType: innerError.message.includes('not connected') ? 'AUTH_MISSING' : 'API_ERROR',
                message: innerError.message 
            });
        }
    } catch (error) {
        console.error("Global generate-meet error:", error);
        res.status(500).json({ message: error.message });
    }
});

// Create a new attendance session
router.post('/sessions', authenticateToken, authorizeRole('admin', 'instructor'), async (req, res) => {
    const { type, batch_id, course_id, topic, gps_lat, gps_lng, threshold_percentage, duration_mins: provided_duration, meet_link: provided_meet_link, start_date, start_time: provided_start_time, end_time } = req.body;
    const instructor_id = req.user.id;

    try {
        let meet_link = provided_meet_link || null;
        let qr_token = null;
        let qr_expiry = null;
        
        // Combine date and time with validation
        let startDateTime = new Date().toISOString();
        let duration_mins = provided_duration || 60;

        if (start_date && provided_start_time) {
            const parsedStart = new Date(`${start_date}T${provided_start_time}`);
            if (!isNaN(parsedStart.getTime())) {
                startDateTime = parsedStart.toISOString();
                
                // Calculate duration if end_time is provided
                if (end_time) {
                    const parsedEnd = new Date(`${start_date}T${end_time}`);
                    if (!isNaN(parsedEnd.getTime())) {
                        const diffMs = parsedEnd.getTime() - parsedStart.getTime();
                        if (diffMs > 0) {
                            duration_mins = Math.floor(diffMs / 60000);
                        }
                    }
                }
            }
        }

        if (type === 'online' && !meet_link) {
            try {
                const meetData = await createMeetSession(instructor_id, topic, startDateTime, duration_mins || 60);
                meet_link = meetData.meetLink;
            } catch (err) {
                console.warn("Could not create real Meet session, using fallback:", err.message);
                // Realistic fallback pattern: meet.google.com/abc-defg-hij
                const part1 = Math.random().toString(36).substring(2, 5);
                const part2 = Math.random().toString(36).substring(2, 6);
                const part3 = Math.random().toString(36).substring(2, 5);
                meet_link = `https://meet.jit.si/CynexClassroom-${part1}${part2}${part3}`;
            }
        } else if (type === 'offline') {
            qr_token = `qr_${Date.now()}_${Math.random().toString(36).substring(5)}`;
            qr_expiry = new Date(new Date(startDateTime).getTime() + (duration_mins || 60) * 60000).toISOString();
        }

        // Determine initial status based on start time
        const startTimestamp = new Date(startDateTime).getTime();
        const nowTimestamp = Date.now();
        const status = (startTimestamp > nowTimestamp + 300000) ? 'scheduled' : 'ongoing';

        const result = await db.execute({
            sql: `INSERT INTO attendance_sessions (type, batch_id, course_id, instructor_id, topic, meet_link, qr_token, qr_expiry, gps_lat, gps_lng, status, threshold_percentage, duration_mins, start_time) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                type, 
                batch_id || null, 
                course_id || null, 
                instructor_id, 
                topic || 'Untitled Session', 
                meet_link, 
                qr_token, 
                qr_expiry, 
                gps_lat || null, 
                gps_lng || null,
                status,
                threshold_percentage || 75,
                duration_mins || 60,
                startDateTime
            ]
        });

        const sessionId = Number(result.lastInsertRowid);
        res.status(201).json({ id: sessionId, type, meet_link, qr_token, qr_expiry });
    } catch (error) {
        console.error("Error creating session:", error);
        res.status(500).json({ message: error.message });
    }
});

// Get rotating QR token for a session
router.get('/sessions/:id/token', authenticateToken, authorizeRole('admin', 'instructor'), async (req, res) => {
    try {
        const token = generateQRToken(req.params.id);
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get live attendance count for a session
router.get('/sessions/:id/count', authenticateToken, async (req, res) => {
    try {
        const count = await db.execute({
            sql: "SELECT COUNT(*) as count FROM attendance_records WHERE session_id = ?",
            args: [req.params.id]
        });
        res.json({ count: count.rows[0].count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get upcoming sessions for a batch (Student)
router.get('/sessions/upcoming', authenticateToken, async (req, res) => {
    try {
        const studentId = req.user.id;
        const userRes = await db.execute({
            sql: "SELECT batch_id FROM users WHERE id = ?",
            args: [studentId]
        });
        const batchId = userRes.rows[0]?.batch_id;

        const sessions = await db.execute({
            sql: `SELECT s.*, u.name as instructor_name, c.title as course_title, b.batch_name
                  FROM attendance_sessions s
                  JOIN users u ON s.instructor_id = u.id
                  JOIN courses c ON s.course_id = c.id
                  LEFT JOIN batches b ON s.batch_id = b.id
                  WHERE s.status = 'ongoing' 
                  AND s.start_time > datetime('now')
                  AND (s.batch_id = ? OR s.batch_id IS NULL)
                  AND (
                      (s.course_id IN (SELECT course_id FROM batch_courses WHERE batch_id = ?))
                      OR 
                      (s.course_id IN (SELECT course_id FROM enrollments WHERE student_id = ?))
                  )
                  ORDER BY s.start_time ASC`,
            args: [batchId, batchId, studentId]
        });

        res.json(sessions.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get active sessions for a batch (Student)
router.get('/sessions/active', authenticateToken, async (req, res) => {
    try {
        const studentId = req.user.id;
        const userRes = await db.execute({
            sql: "SELECT batch_id FROM users WHERE id = ?",
            args: [studentId]
        });
        const batchId = userRes.rows[0]?.batch_id;

        const sessions = await db.execute({
            sql: `SELECT s.*, u.name as instructor_name, c.title as course_title, b.batch_name
                  FROM attendance_sessions s
                  JOIN users u ON s.instructor_id = u.id
                  JOIN courses c ON s.course_id = c.id
                  LEFT JOIN batches b ON s.batch_id = b.id
                  WHERE s.status = 'ongoing'
                  AND (s.batch_id = ? OR s.batch_id IS NULL)
                  AND (
                      (s.course_id IN (SELECT course_id FROM batch_courses WHERE batch_id = ?))
                      OR 
                      (s.course_id IN (SELECT course_id FROM enrollments WHERE student_id = ?))
                  )
                  ORDER BY s.start_time DESC`,
            args: [batchId, batchId, studentId]
        });

        console.log(`[DEBUG] Active Sessions for Student (Batch: ${batchId}):`, sessions.rows.length);
        res.json(sessions.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Stop a session
router.post('/sessions/:id/stop', authenticateToken, authorizeRole('admin', 'instructor'), async (req, res) => {
    try {
        await db.execute({
            sql: "UPDATE attendance_sessions SET status = 'completed', end_time = CURRENT_TIMESTAMP WHERE id = ?",
            args: [req.params.id]
        });
        res.json({ message: "Session stopped successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update session details
router.put('/sessions/:id', authenticateToken, authorizeRole('admin', 'instructor'), async (req, res) => {
    const { topic, duration_mins, threshold_percentage, meet_link } = req.body;
    try {
        await db.execute({
            sql: `UPDATE attendance_sessions 
                  SET topic = ?, duration_mins = ?, threshold_percentage = ?, meet_link = ? 
                  WHERE id = ?`,
            args: [topic, duration_mins, threshold_percentage, meet_link, req.params.id]
        });
        res.json({ message: "Session updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mark attendance via QR Scan (Student)
router.post('/scan', authenticateToken, async (req, res) => {
    const { qrToken, gpsData, deviceInfo } = req.body;
    const studentId = req.user.id;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';

    let sessionId = null;

    try {
        // 1. Validate the dynamic QR Token or Demo Mode Static Token
        if (qrToken.startsWith('qr_')) {
            // Demo Mode fallback: lookup the session by the static initial token
            const sessionRes = await db.execute({
                sql: "SELECT id FROM attendance_sessions WHERE qr_token = ?",
                args: [qrToken]
            });
            if (sessionRes.rows.length === 0) {
                throw new Error("Invalid or expired static QR token");
            }
            sessionId = sessionRes.rows[0].id;
        } else {
            // Standard Flow: Decode the rotating JWT
            const decoded = validateQRToken(qrToken);
            sessionId = decoded.sessionId;
        }

        // 2. Mark attendance with full security checks
        const result = await markAttendance(sessionId, studentId, gpsData, deviceInfo, ipAddress);
        
        // 3. Log the scan for audit purposes
        await db.execute({
            sql: `INSERT INTO qr_scan_logs (student_id, session_id, ip_address, device_info, gps_latitude, gps_longitude, validation_status) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [studentId, sessionId, ipAddress, deviceInfo, gpsData?.lat, gpsData?.lng, 'success']
        });

        res.json(result);
    } catch (error) {
        // Log failed attempt
        await db.execute({
            sql: `INSERT INTO qr_scan_logs (student_id, session_id, ip_address, device_info, validation_status) 
                  VALUES (?, ?, ?, ?, ?)`,
            args: [studentId, sessionId || 0, ipAddress, deviceInfo, 'failed: ' + error.message]
        });
        res.status(400).json({ message: error.message });
    }
});

// --- Secure QR Verification (JWT-AES) ---
const AES_KEY = process.env.AES_SECRET_KEY || '12345678901234567890123456789012'; // 32 bytes
const AES_IV = process.env.AES_IV || '1234567890123456'; // 16 bytes

function decryptAESToken(encryptedText) {
    try {
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(AES_KEY), Buffer.from(AES_IV));
        let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        throw new Error("Failed to decrypt AES token");
    }
}

// Implement Student Attendance QR Scanner Module verify endpoint
router.post('/verify', authenticateToken, async (req, res) => {
    try {
        const { qrToken, gpsData, deviceInfo } = req.body;
        const studentId = req.user.id;
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        
        if (!qrToken) {
            return res.status(400).json({ status: 'error', message: "Token is missing" });
        }
        
        let sessionId = null;

        // 1. Resolve Session ID from Token
        if (qrToken.startsWith('qr_')) {
            // Demo/Static Mode: lookup the session by the initial token
            const sessionRes = await db.execute({
                sql: "SELECT id FROM attendance_sessions WHERE qr_token = ?",
                args: [qrToken]
            });
            if (sessionRes.rows.length === 0) {
                throw new Error("Invalid or expired static QR token");
            }
            sessionId = sessionRes.rows[0].id;
        } else {
            // Standard Flow: Decode the rotating JWT
            try {
                // Try QR_SECRET first (as used by generateQRToken)
                const decoded = validateQRToken(qrToken);
                sessionId = decoded.sessionId;
            } catch (err) {
                // Fallback for legacy/other tokens if necessary
                try {
                    const decoded = jwt.verify(qrToken, process.env.JWT_SECRET || 'fallback_secret');
                    sessionId = decoded.sessionId || decoded.courseId; // Adjust based on token structure
                } catch (innerErr) {
                    throw new Error("Invalid or expired QR code signature.");
                }
            }
        }

        if (!sessionId) {
            throw new Error("Could not resolve session identity.");
        }

        // 2. Mark attendance using the core service (handles GPS, Expiry, Duplicates)
        const result = await markAttendance(sessionId, studentId, gpsData, deviceInfo, ipAddress);
        
        // 3. Sync with qr_attendance_records for compatibility with older modules if needed
        await db.execute({
            sql: `INSERT OR IGNORE INTO qr_attendance_records (student_id, session_id, course_id, gps_lat, gps_long, token_id) 
                  SELECT ?, ?, course_id, ?, ?, ? FROM attendance_sessions WHERE id = ?`,
            args: [studentId, sessionId, gpsData?.lat || null, gpsData?.lng || null, qrToken, sessionId]
        });

        res.json({ 
            status: 'success', 
            message: result.message || "Attendance marked successfully",
            data: result
        });
    } catch (error) {
        console.error("QR Verification Error:", error.message);
        res.status(400).json({ 
            status: 'error', 
            message: error.message || "Database error occurred" 
        });
    }
});

// --- Analytics & Reports ---

// Get student dashboard stats
router.get('/student/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await getStudentStats(req.user.id);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get student calendar data
router.get('/student/calendar', authenticateToken, async (req, res) => {
    try {
        const calendar = await getStudentCalendar(req.user.id);
        res.json(calendar);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get analytics data
router.get('/analytics', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'admin' || req.user.role === 'instructor') {
            const totalSessions = await db.execute("SELECT COUNT(*) as count FROM attendance_sessions");
            const typeBreakdown = await db.execute("SELECT type, COUNT(*) as count FROM attendance_sessions GROUP BY type");
            
            // 30-day trend
            const recentAttendance = await db.execute(`
                SELECT DATE(join_time) as date, COUNT(*) as count 
                FROM attendance_records 
                WHERE join_time >= date('now', '-30 days')
                GROUP BY DATE(join_time) 
                ORDER BY date ASC
            `);

            // Batch-wise performance
            const batchStats = await db.execute(`
                SELECT b.batch_name as name, COUNT(r.id) as count
                FROM batches b
                LEFT JOIN users u ON b.id = u.batch_id
                LEFT JOIN attendance_records r ON u.id = r.student_id
                GROUP BY b.id
            `);

            res.json({
                summary: {
                    totalSessions: totalSessions.rows[0].count,
                    activeUsers: 142 
                },
                typeBreakdown: typeBreakdown.rows,
                trends: recentAttendance.rows,
                batchStats: batchStats.rows
            });
        } else {
            // Student Analytics
            const analytics = await getStudentAnalytics(req.user.id);
            res.json(analytics);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Generate CSV Report
router.get('/reports/export', authenticateToken, async (req, res) => {
    try {
        const { batch_id } = req.query;
        let sql = `SELECT r.*, s.topic, s.type, c.title as course_title, u.name as student_name, b.batch_name
                  FROM attendance_records r
                  LEFT JOIN attendance_sessions s ON r.session_id = s.id
                  LEFT JOIN courses c ON s.course_id = c.id
                  LEFT JOIN users u ON r.student_id = u.id
                  LEFT JOIN batches b ON u.batch_id = b.id`;
        let args = [];
        let whereClauses = [];

        if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
            whereClauses.push(`r.student_id = ?`);
            args.push(req.user.id);
        } else if (batch_id && batch_id !== 'all') {
            whereClauses.push(`u.batch_id = ?`);
            args.push(batch_id);
        }

        if (whereClauses.length > 0) {
            sql += ` WHERE ` + whereClauses.join(' AND ');
        }

        sql += ` ORDER BY r.join_time DESC`;
        const history = await db.execute({ sql, args });

        const rows = history.rows.map(r => ({
            StudentName: r.student_name,
            Batch: r.batch_name || 'N/A',
            Subject: r.course_title,
            Topic: r.topic,
            Date: r.join_time ? new Date(r.join_time).toLocaleDateString() : 'N/A',
            Time: r.join_time ? new Date(r.join_time).toLocaleTimeString() : 'N/A',
            Type: r.type,
            Status: r.status
        }));

        res.json(rows); // Frontend will convert to CSV
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get attendance notifications/alerts
router.get('/notifications', authenticateToken, async (req, res) => {
    try {
        const stats = await getStudentStats(req.user.id);
        const notifications = [];

        if (stats.attendancePercentage < 75) {
            notifications.push({
                type: 'warning',
                title: 'Attendance Warning',
                message: `Your attendance is currently ${stats.attendancePercentage}%, which is below the 75% threshold.`,
                date: new Date().toISOString()
            });
        }

        // Recent classes notification (Filtered by student's enrollment and batch)
        const studentId = req.user.id;
        const userRes = await db.execute({
            sql: "SELECT batch_id FROM users WHERE id = ?",
            args: [studentId]
        });
        const batchId = userRes.rows[0]?.batch_id;

        const recent = await db.execute({
            sql: `SELECT s.topic, s.start_time 
                  FROM attendance_sessions s 
                  WHERE s.status = 'ongoing' 
                  AND (s.batch_id = ? OR s.batch_id IS NULL)
                  AND (
                      (s.course_id IN (SELECT course_id FROM batch_courses WHERE batch_id = ?))
                      OR 
                      (s.course_id IN (SELECT course_id FROM enrollments WHERE student_id = ?))
                  )
                  LIMIT 5`,
            args: [batchId, batchId, studentId]
        });

        recent.rows.forEach(session => {
            notifications.push({
                type: 'info',
                title: 'Active Session',
                message: `Live class: "${session.topic}" is currently ongoing. Mark your attendance now!`,
                date: session.start_time
            });
        });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Edit attendance record
router.put('/records/:id', authenticateToken, authorizeRole('admin', 'instructor'), async (req, res) => {
    try {
        const { status, remarks } = req.body;
        await db.execute({
            sql: `UPDATE attendance_records SET status = ?, remarks = ?, attendance_type = 'manual' WHERE id = ?`,
            args: [status, remarks, req.params.id]
        });
        res.json({ message: "Record updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete attendance record
router.delete('/records/:id', authenticateToken, authorizeRole('admin', 'instructor'), async (req, res) => {
    try {
        await db.execute({
            sql: "DELETE FROM attendance_records WHERE id = ?",
            args: [req.params.id]
        });
        res.json({ message: "Record deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get detailed records for a session
router.get('/sessions/:id/records', authenticateToken, async (req, res) => {
    try {
        const records = await db.execute({
            sql: `SELECT r.*, u.name as student_name, u.email as student_email 
                  FROM attendance_records r
                  JOIN users u ON r.student_id = u.id
                  WHERE r.session_id = ?
                  ORDER BY r.join_time DESC`,
            args: [req.params.id]
        });
        res.json(records.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Manual attendance entry (Admin/Instructor)
router.post('/manual-entry', authenticateToken, authorizeRole('admin', 'instructor'), async (req, res) => {
    const { sessionId, studentId } = req.body;
    
    try {
        await db.execute({
            sql: `INSERT INTO attendance_records (
                    session_id, student_id, join_time, status, 
                    attendance_type, remarks
                  ) VALUES (?, ?, CURRENT_TIMESTAMP, 'present', 'manual', 'Manually marked by instructor')`,
            args: [sessionId, studentId]
        });
        res.status(201).json({ message: "Attendance marked successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Join Online Class (Mark Attendance)
router.post('/student/join-online', authenticateToken, async (req, res) => {
    const { sessionId } = req.body;
    try {
        const session = await db.execute({
            sql: "SELECT * FROM attendance_sessions WHERE id = ? AND type = 'online' AND status = 'ongoing'",
            args: [sessionId]
        });

        if (session.rows.length === 0) {
            return res.status(404).json({ message: "Active online session not found." });
        }

        // Check if already marked
        const existing = await db.execute({
            sql: "SELECT id FROM attendance_records WHERE session_id = ? AND student_id = ?",
            args: [sessionId, req.user.id]
        });

        if (existing.rows.length > 0) {
            return res.json({ message: "Attendance already marked." });
        }

        await db.execute({
            sql: `INSERT INTO attendance_records (session_id, student_id, join_time, status, attendance_type, attendance_percentage, late_flag, remarks)
                  VALUES (?, ?, CURRENT_TIMESTAMP, 'present', 'online', 100, 0, 'Joined via Online Portal')`,
            args: [sessionId, req.user.id]
        });

        res.status(201).json({ message: "Attendance marked successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Legacy support / Student history
// Student history
router.get('/history/my', authenticateToken, async (req, res) => {
    try {
        const { batch_id } = req.query;
        let sql = `SELECT r.*, s.topic, s.type, c.title as course_title, u.name as instructor_name, student_u.name as student_name, b.batch_name
                  FROM attendance_records r
                  LEFT JOIN attendance_sessions s ON r.session_id = s.id
                  LEFT JOIN courses c ON s.course_id = c.id
                  LEFT JOIN users u ON s.instructor_id = u.id
                  JOIN users student_u ON r.student_id = student_u.id
                  LEFT JOIN batches b ON student_u.batch_id = b.id`;
        let args = [];
        let whereClauses = [];

        if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
            whereClauses.push(`r.student_id = ?`);
            args.push(req.user.id);
        } else if (batch_id && batch_id !== 'all') {
            whereClauses.push(`student_u.batch_id = ?`);
            args.push(batch_id);
        }

        if (whereClauses.length > 0) {
            sql += ` WHERE ` + whereClauses.join(' AND ');
        }

        sql += ` ORDER BY r.join_time DESC LIMIT 500`;

        const history = await db.execute({ sql, args });
        res.json(history.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// ========================================
// GOOGLE MEET INTEGRATION ROUTES
// ========================================

// POST /sessions/:id/pull-meet — Auto-pull attendance from Google Meet after session ends
router.post('/sessions/:id/pull-meet', authenticateToken, authorizeRole('admin', 'instructor'), async (req, res) => {
    try {
        const result = await pullMeetAttendance(req.params.id, req.user.id);
        res.json(result);
    } catch (error) {
        console.error('Meet pull error:', error);
        res.status(400).json({ message: error.message });
    }
});

// GET /sessions/:id/report — Per-session detailed attendance report
router.get('/sessions/:id/report', authenticateToken, authorizeRole('admin', 'instructor'), async (req, res) => {
    try {
        const report = await getSessionReport(req.params.id);
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /records/:id/override — Manual override of attendance status (Instructor/Admin)
router.put('/records/:id/override', authenticateToken, authorizeRole('admin', 'instructor'), async (req, res) => {
    const { status, remarks } = req.body;
    const validStatuses = ['present', 'absent', 'partial', 'excused'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(', ')}` });
    }
    try {
        // Audit trail: save previous value in remarks
        const prev = await db.execute({
            sql: 'SELECT status, attendance_type FROM attendance_records WHERE id = ?',
            args: [req.params.id]
        });
        const prevStatus = prev.rows[0]?.status || 'unknown';

        await db.execute({
            sql: `UPDATE attendance_records 
                  SET status = ?, attendance_type = 'manual', 
                      remarks = ?, overridden_by = ?, overridden_at = CURRENT_TIMESTAMP
                  WHERE id = ?`,
            args: [
                status,
                remarks || `Manually overridden from '${prevStatus}' by instructor.`,
                req.user.id,
                req.params.id
            ]
        });
        res.json({ message: 'Attendance record updated successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /sessions/:id — Delete all attendance records for a session (Admin only)
router.delete('/sessions/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        await db.execute({
            sql: 'DELETE FROM attendance_records WHERE session_id = ?',
            args: [req.params.id]
        });
        await db.execute({
            sql: 'DELETE FROM attendance_sessions WHERE id = ?',
            args: [req.params.id]
        });
        res.json({ message: 'Session and all attendance records deleted.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /reports/cumulative — Cumulative report per student/batch (Admin/Instructor)
router.get('/reports/cumulative', authenticateToken, authorizeRole('admin', 'instructor'), async (req, res) => {
    const { batch_id, course_id } = req.query;
    try {
        let sql = `
            SELECT 
                u.id as student_id, u.name as student_name, u.email as student_email,
                b.batch_name,
                c.title as course_title,
                COUNT(DISTINCT s.id) as total_sessions,
                COUNT(CASE WHEN r.status = 'present' THEN 1 END) as present_count,
                COUNT(CASE WHEN r.status = 'absent' THEN 1 END) as absent_count,
                COUNT(CASE WHEN r.status = 'partial' THEN 1 END) as partial_count,
                COUNT(CASE WHEN r.late_flag = 1 THEN 1 END) as late_count,
                ROUND(
                    CAST(COUNT(CASE WHEN r.status = 'present' THEN 1 END) AS FLOAT) / 
                    NULLIF(COUNT(DISTINCT s.id), 0) * 100, 
                    2
                ) as attendance_percentage
            FROM users u
            LEFT JOIN batches b ON u.batch_id = b.id
            LEFT JOIN attendance_records r ON u.id = r.student_id
            LEFT JOIN attendance_sessions s ON r.session_id = s.id
            LEFT JOIN courses c ON s.course_id = c.id
            WHERE u.role = 'student'
        `;
        const args = [];
        if (batch_id) { sql += ` AND u.batch_id = ?`; args.push(batch_id); }
        if (course_id) { sql += ` AND s.course_id = ?`; args.push(course_id); }
        sql += ` GROUP BY u.id, c.id ORDER BY attendance_percentage ASC`;

        const result = await db.execute({ sql, args });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /reports/export-advanced — Export with filters: batch, subject, date range
router.get('/reports/export-advanced', authenticateToken, authorizeRole('admin', 'instructor'), async (req, res) => {
    const { batch_id, course_id, date_from, date_to, format } = req.query;
    try {
        let sql = `
            SELECT 
                u.name as Student, u.email as Email,
                b.batch_name as Batch, c.title as Course,
                s.topic as Topic, s.type as Mode,
                r.status as Status,
                COALESCE(r.duration_mins, 0) as Duration_Mins,
                COALESCE(r.attendance_percentage, 0) as Attendance_Pct,
                CASE WHEN r.late_flag = 1 THEN 'Yes' ELSE 'No' END as Late_Join,
                r.attendance_type as Record_Type,
                r.remarks as Remarks,
                DATE(r.join_time) as Date
            FROM attendance_records r
            JOIN users u ON r.student_id = u.id
            JOIN attendance_sessions s ON r.session_id = s.id
            JOIN courses c ON s.course_id = c.id
            LEFT JOIN batches b ON s.batch_id = b.id
            WHERE 1=1
        `;
        const args = [];
        if (batch_id) { sql += ` AND s.batch_id = ?`; args.push(batch_id); }
        if (course_id) { sql += ` AND s.course_id = ?`; args.push(course_id); }
        if (date_from) { sql += ` AND DATE(r.join_time) >= ?`; args.push(date_from); }
        if (date_to) { sql += ` AND DATE(r.join_time) <= ?`; args.push(date_to); }
        sql += ` ORDER BY r.join_time DESC`;

        const result = await db.execute({ sql, args });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /sessions — List all sessions (Admin/Instructor)
router.get('/sessions', authenticateToken, authorizeRole('admin', 'instructor'), async (req, res) => {
    try {
        const { status, type, batch_id } = req.query;
        let sql = `SELECT s.*, u.name as instructor_name, c.title as course_title, b.batch_name
                   FROM attendance_sessions s
                   LEFT JOIN users u ON s.instructor_id = u.id
                   LEFT JOIN courses c ON s.course_id = c.id
                   LEFT JOIN batches b ON s.batch_id = b.id
                   WHERE 1=1`;
        const args = [];
        if (status) { sql += ` AND s.status = ?`; args.push(status); }
        if (type) { sql += ` AND s.type = ?`; args.push(type); }
        if (batch_id) { sql += ` AND s.batch_id = ?`; args.push(batch_id); }
        sql += ` ORDER BY s.start_time DESC LIMIT 100`;
        const result = await db.execute({ sql, args });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Google Auth Routes ---

router.get('/google/auth-url', authenticateToken, authorizeRole('admin', 'instructor'), async (req, res) => {
    try {
        const url = getAuthUrl();
        res.json({ url });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/google/callback', authenticateToken, authorizeRole('admin', 'instructor'), async (req, res) => {
    const { code } = req.body;
    try {
        await saveTokens(req.user.id, code);
        res.json({ message: "Google account connected successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// GET /analytics-dashboard — Real-time metrics for Admin Overview
router.get('/analytics-dashboard', authenticateToken, authorizeRole('admin', 'instructor'), async (req, res) => {
    try {
        console.log(`[ATTENDANCE] Fetching dashboard analytics for user ${req.user.id}`);
        
        // Use Promise.allSettled to ensure we get as much data as possible even if some queries fail
        const results = await Promise.allSettled([
            db.execute(`
                SELECT COUNT(DISTINCT student_id) as count 
                FROM attendance_records 
                WHERE status IN ('present', 'partial') 
                AND join_time >= date('now', '-30 days')
            `),
            db.execute(`
                SELECT AVG(attendance_percentage) as avg_engagement 
                FROM attendance_records r
                JOIN attendance_sessions s ON r.session_id = s.id
                WHERE s.type = 'online'
            `),
            db.execute(`
                SELECT COUNT(*) as count 
                FROM attendance_records r
                JOIN attendance_sessions s ON r.session_id = s.id
                WHERE s.type = 'offline'
            `),
            db.execute(`
                SELECT 
                    (CAST(COUNT(CASE WHEN status = 'present' THEN 1 END) AS FLOAT) / 
                    NULLIF(COUNT(*), 0)) * 100 as rate
                FROM attendance_records
            `),
            db.execute(`
                SELECT 
                    r.id, r.student_id, r.join_time, r.status,
                    u.name as student_name, s.topic, s.type as mode
                FROM attendance_records r
                JOIN users u ON r.student_id = u.id
                JOIN attendance_sessions s ON r.session_id = s.id
                ORDER BY r.join_time DESC
                LIMIT 10
            `)
        ]);

        // Process results safely
        const getValue = (index, field, defaultValue = 0) => {
            if (results[index].status === 'fulfilled' && results[index].value.rows.length > 0) {
                return results[index].value.rows[0][field] || defaultValue;
            }
            if (results[index].status === 'rejected') {
                console.error(`Query ${index} failed:`, results[index].reason);
            }
            return defaultValue;
        };

        const recentActivity = results[4].status === 'fulfilled' ? results[4].value.rows : [];

        res.status(200).json({
            status: 'success',
            summary: {
                activePresence: getValue(0, 'count'),
                meetEngagement: Math.round(getValue(1, 'avg_engagement')),
                offlineScans: getValue(2, 'count'),
                successRate: Math.round(getValue(3, 'rate'))
            },
            recentActivity: recentActivity.map(row => ({
                ...row,
                student_name: row.student_name || 'Unknown Student',
                topic: row.topic || 'No Topic'
            }))
        });

    } catch (error) {
        console.error('CRITICAL: Dashboard Analytics Failure:', error);
        res.status(200).json({ 
            status: 'error',
            message: 'Failed to retrieve analytics data. Please try again later.',
            summary: { activePresence: 0, meetEngagement: 0, offlineScans: 0, successRate: 0 },
            recentActivity: []
        });
    }
});

export default router;

