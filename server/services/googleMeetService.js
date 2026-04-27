/**
 * Google Meet Attendance Service
 * Simulates the Google Admin SDK Reports API (admin.reports.v1)
 * In production: use OAuth2 service account with domain-wide delegation
 * API: admin.reports.v1 - 'meet' application events
 * Fields: calendar_event_id, organizer, participant_email, call_duration_seconds, meeting_code
 */

import { db } from '../db.js';

/**
 * Simulate pulling Google Meet attendance for a session.
 * In production this would call:
 *   GET https://admin.googleapis.com/admin/reports/v1/activity/users/all/applications/meet
 *   filtered by calendar_event_id matching the session's meet_code
 */
export const pullMeetAttendance = async (sessionId, instructorId) => {
    // 1. Fetch session info
    const sessionRes = await db.execute({
        sql: `SELECT s.*, c.title as course_title, b.batch_name,
                     u.name as instructor_name
              FROM attendance_sessions s
              LEFT JOIN courses c ON s.course_id = c.id
              LEFT JOIN batches b ON s.batch_id = b.id
              LEFT JOIN users u ON s.instructor_id = u.id
              WHERE s.id = ?`,
        args: [sessionId]
    });

    if (sessionRes.rows.length === 0) throw new Error('Session not found');
    const session = sessionRes.rows[0];

    if (session.type !== 'online') throw new Error('Pull is only available for online sessions');
    if (session.status === 'ongoing') throw new Error('Session is still ongoing. Stop it first before pulling attendance.');

    // 2. Get all students enrolled in this batch
    const studentsRes = await db.execute({
        sql: `SELECT u.id, u.name, u.email 
              FROM users u 
              WHERE u.batch_id = ? AND u.role = 'student'`,
        args: [session.batch_id]
    });

    if (studentsRes.rows.length === 0) {
        return { pulled: 0, message: 'No students found in batch', records: [] };
    }

    const threshold = session.threshold_percentage || 75;
    const sessionDurationMins = session.duration_mins || 60;
    const lateJoinMinutes = 15; // Flag students joining after 15 mins
    const records = [];
    let pulled = 0;
    let overridden = 0;

    for (const student of studentsRes.rows) {
        // Check if record already exists
        const existingRes = await db.execute({
            sql: 'SELECT id, status, attendance_type FROM attendance_records WHERE session_id = ? AND student_id = ?',
            args: [sessionId, student.id]
        });

        // Simulate Google Meet API data: random participation (realistic demo)
        // In production: fetch actual join/leave events from admin.reports.v1
        const attended = Math.random() > 0.3; // 70% attendance simulation
        const joinDelayMins = Math.floor(Math.random() * 25); // 0-25 min join delay
        const attendedDurationMins = attended
            ? Math.floor(sessionDurationMins * (0.4 + Math.random() * 0.65))
            : 0;
        const attendedPercentage = sessionDurationMins > 0
            ? Math.round((attendedDurationMins / sessionDurationMins) * 100)
            : 0;

        const isPresent = attendedPercentage >= threshold;
        const isLateJoin = attended && joinDelayMins >= lateJoinMinutes;
        const status = attended ? (isPresent ? 'present' : 'partial') : 'absent';

        const record = {
            student_id: student.id,
            student_name: student.name,
            student_email: student.email,
            session_id: sessionId,
            join_time: attended
                ? new Date(Date.now() - (sessionDurationMins - joinDelayMins) * 60000).toISOString()
                : null,
            duration_mins: attendedDurationMins,
            attendance_percentage: attendedPercentage,
            status,
            late_join: isLateJoin ? 1 : 0,
            attendance_type: 'meet_auto',
            remarks: isLateJoin
                ? `Late join (+${joinDelayMins} min). Auto-pulled from Google Meet.`
                : 'Auto-pulled from Google Meet API.'
        };

        if (existingRes.rows.length > 0) {
            const existing = existingRes.rows[0];
            // Only overwrite non-manual records
            if (existing.attendance_type !== 'manual') {
                await db.execute({
                    sql: `UPDATE attendance_records 
                          SET status = ?, join_time = ?, duration_mins = ?, 
                              attendance_percentage = ?, late_flag = ?, 
                              attendance_type = ?, remarks = ?
                          WHERE session_id = ? AND student_id = ?`,
                    args: [
                        record.status, record.join_time, record.duration_mins,
                        record.attendance_percentage, record.late_join,
                        record.attendance_type, record.remarks,
                        sessionId, student.id
                    ]
                });
                overridden++;
            }
        } else {
            await db.execute({
                sql: `INSERT INTO attendance_records 
                        (session_id, student_id, join_time, status, duration_mins,
                         attendance_percentage, late_flag, attendance_type, remarks)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    sessionId, student.id, record.join_time, record.status,
                    record.duration_mins, record.attendance_percentage,
                    record.late_join, record.attendance_type, record.remarks
                ]
            });
            pulled++;
        }

        records.push({ ...record, student_name: student.name, student_email: student.email });
    }

    return {
        pulled,
        overridden,
        total: studentsRes.rows.length,
        threshold,
        session: {
            id: session.id,
            topic: session.topic,
            course: session.course_title,
            duration_mins: sessionDurationMins
        },
        records,
        message: `Auto-pulled ${pulled} new + updated ${overridden} records via Google Meet API simulation.`
    };
};

/**
 * Get detailed session report with per-student stats
 */
export const getSessionReport = async (sessionId) => {
    const sessionRes = await db.execute({
        sql: `SELECT s.*, c.title as course_title, b.batch_name, u.name as instructor_name
              FROM attendance_sessions s
              LEFT JOIN courses c ON s.course_id = c.id
              LEFT JOIN batches b ON s.batch_id = b.id
              LEFT JOIN users u ON s.instructor_id = u.id
              WHERE s.id = ?`,
        args: [sessionId]
    });
    if (sessionRes.rows.length === 0) throw new Error('Session not found');
    const session = sessionRes.rows[0];

    const recordsRes = await db.execute({
        sql: `SELECT r.*, u.name as student_name, u.email as student_email
              FROM attendance_records r
              JOIN users u ON r.student_id = u.id
              WHERE r.session_id = ?
              ORDER BY r.status ASC, u.name ASC`,
        args: [sessionId]
    });

    const records = recordsRes.rows;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const partial = records.filter(r => r.status === 'partial').length;
    const lateJoins = records.filter(r => r.late_flag).length;

    return {
        session,
        summary: {
            total: records.length,
            present,
            absent,
            partial,
            lateJoins,
            presentPercentage: records.length > 0 ? Math.round((present / records.length) * 100) : 0
        },
        records
    };
};
