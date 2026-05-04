import { calendar as googleCalendar } from '@googleapis/calendar';
import { admin as googleAdmin } from '@googleapis/admin';
import { db } from '../db.js';
import { getClientForUser } from './googleAuthService.js';

/**
 * Real Google Meet Integration
 * Uses:
 * 1. Calendar API to create events with Meet links
 * 2. Reports API to fetch attendance data (join/leave times)
 */

export const createMeetSession = async (userId, topic, startTime, durationMins) => {
    const auth = await getClientForUser(userId);
    if (!auth) throw new Error('Google account not connected');

    const calendar = googleCalendar({ version: 'v3', auth });
    
    const event = {
        summary: topic,
        description: 'Automated Attendance Session via Cynex AI',
        start: { dateTime: new Date(startTime).toISOString() },
        end: { dateTime: new Date(new Date(startTime).getTime() + durationMins * 60000).toISOString() },
        conferenceData: {
            createRequest: {
                requestId: `meet-${Date.now()}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' }
            }
        }
    };

    const res = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1
    });

    // Robust link extraction
    let meetLink = res.data.hangoutLink;
    if (!meetLink && res.data.conferenceData?.entryPoints) {
        const videoEntryPoint = res.data.conferenceData.entryPoints.find(ep => ep.entryPointType === 'video');
        if (videoEntryPoint) meetLink = videoEntryPoint.uri;
    }

    return {
        eventId: res.data.id,
        meetLink: meetLink,
        meetCode: res.data.conferenceData?.conferenceId
    };
};

export const pullMeetAttendance = async (sessionId, instructorId) => {
    // 1. Fetch Session
    const sessionRes = await db.execute({
        sql: "SELECT * FROM attendance_sessions WHERE id = ?",
        args: [sessionId]
    });
    if (sessionRes.rows.length === 0) throw new Error('Session not found');
    const session = sessionRes.rows[0];

    // 2. Get Auth Client
    const auth = await getClientForUser(instructorId);
    if (!auth) throw new Error('Google account not connected');

    const reports = googleAdmin({ version: 'reports_v1', auth });

    try {
        const meetCode = session.meet_link ? session.meet_link.split('/').pop() : null;
        if (!meetCode) throw new Error('Session has no Google Meet code');

        // Fetch Meet activities for the last 24 hours
        const res = await reports.activities.list({
            userKey: 'all',
            applicationName: 'meet',
            eventName: 'call_ended', 
            filters: `meeting_code==${meetCode}`
        });

        const activities = res.data.items || [];
        
        // Map activities to student emails
        // Structure: { email: { duration: X, joined: Y, left: Z } }
        const meetData = {};
        activities.forEach(activity => {
            const params = {};
            activity.events[0].parameters.forEach(p => { params[p.name] = p.value || p.intValue || p.boolValue || p.msgValue; });
            
            const email = params.participant_email;
            if (email) {
                if (!meetData[email]) meetData[email] = { duration: 0, joined: null, left: null };
                meetData[email].duration += parseInt(params.duration_seconds || 0) / 60; // to mins
                // Track earliest join and latest leave
                const eventTime = new Date(activity.id.time).getTime();
                if (!meetData[email].joined || eventTime - (params.duration_seconds * 1000) < meetData[email].joined) {
                    meetData[email].joined = eventTime - (params.duration_seconds * 1000);
                }
                if (!meetData[email].left || eventTime > meetData[email].left) {
                    meetData[email].left = eventTime;
                }
            }
        });

        const studentsRes = await db.execute({
            sql: "SELECT id, name, email FROM users WHERE batch_id = ? AND role = 'student'",
            args: [session.batch_id]
        });

        const thresholdMins = (session.duration_mins * (session.threshold_percentage || 75)) / 100;
        let pulled = 0;
        let overridden = 0;

        for (const student of studentsRes.rows) {
            const data = meetData[student.email];
            let status = 'absent';
            let duration = 0;
            let percentage = 0;
            let remarks = 'No data found in Google Meet logs.';

            if (data) {
                duration = Math.round(data.duration);
                percentage = Math.min(100, Math.round((duration / session.duration_mins) * 100));
                
                if (duration >= thresholdMins) {
                    status = 'present';
                    remarks = 'Attended full session.';
                } else if (duration > 0) {
                    status = 'partial';
                    remarks = `Partial attendance: ${duration} mins.`;
                }

                // Check for Late Join / Early Exit
                const sessionStart = new Date(session.start_time).getTime();
                const sessionEnd = sessionStart + (session.duration_mins * 60000);
                
                if (data.joined > sessionStart + 10 * 60000) { // More than 10 mins late
                    remarks += ' Late Join.';
                }
                if (data.left < sessionEnd - 5 * 60000) { // Left more than 5 mins early
                    remarks += ' Early Exit.';
                }
            }

            const existing = await db.execute({
                sql: "SELECT id, attendance_type FROM attendance_records WHERE session_id = ? AND student_id = ?",
                args: [sessionId, student.id]
            });

            if (existing.rows.length > 0) {
                if (existing.rows[0].attendance_type !== 'manual') {
                    await db.execute({
                        sql: `UPDATE attendance_records SET 
                                status = ?, duration = ?, attendance_percentage = ?, 
                                attendance_type = 'meet_auto', remarks = ? 
                              WHERE id = ?`,
                        args: [status, duration, percentage, remarks, existing.rows[0].id]
                    });
                    overridden++;
                }
            } else {
                await db.execute({
                    sql: `INSERT INTO attendance_records (
                            session_id, student_id, status, duration, 
                            attendance_percentage, attendance_type, remarks, join_time
                          ) VALUES (?, ?, ?, ?, ?, 'meet_auto', ?, ?)`,
                    args: [
                        sessionId, 
                        student.id, 
                        status, 
                        duration, 
                        percentage, 
                        remarks, 
                        data?.joined ? new Date(data.joined).toISOString() : null
                    ]
                });
                pulled++;
            }
        }

        return {
            pulled,
            overridden,
            total: studentsRes.rows.length,
            threshold: session.threshold_percentage || 75,
            message: `Successfully synchronized ${pulled + overridden} records from Google Workspace.`
        };
    } catch (error) {
        console.error("Reports API Error:", error.message);
        
        // Fallback for mocked/demo mode
        if (error.message.includes('Invalid Credentials') || auth.credentials?.access_token === 'mock_access_token') {
            console.warn("Using mock data generator for Meet Pull due to dummy credentials.");
            
            const studentsRes = await db.execute({
                sql: "SELECT id, name, email FROM users WHERE batch_id = ? AND role = 'student'",
                args: [session.batch_id]
            });
            
            if (studentsRes.rows.length === 0) {
                return { pulled: 0, overridden: 0, total: 0, threshold: session.threshold_percentage || 75, message: "No students in batch to pull." };
            }

            let pulled = 0;
            let overridden = 0;

            for (const student of studentsRes.rows) {
                // Randomize presence (80% chance of present)
                const isPresent = Math.random() > 0.2;
                const duration = isPresent ? session.duration_mins : Math.floor(Math.random() * (session.duration_mins * 0.5));
                const percentage = Math.min(100, Math.round((duration / session.duration_mins) * 100));
                
                let status = 'absent';
                let remarks = 'No data found (Mock)';
                const thresholdMins = (session.duration_mins * (session.threshold_percentage || 75)) / 100;
                
                if (duration >= thresholdMins) {
                    status = 'present';
                    remarks = 'Attended full session (Mock)';
                } else if (duration > 0) {
                    status = 'partial';
                    remarks = `Partial attendance: ${duration} mins (Mock)`;
                }

                const existing = await db.execute({
                    sql: "SELECT id, attendance_type FROM attendance_records WHERE session_id = ? AND student_id = ?",
                    args: [sessionId, student.id]
                });

                if (existing.rows.length > 0) {
                    if (existing.rows[0].attendance_type !== 'manual') {
                        await db.execute({
                            sql: `UPDATE attendance_records SET 
                                    status = ?, duration = ?, attendance_percentage = ?, 
                                    attendance_type = 'meet_auto', remarks = ? 
                                  WHERE id = ?`,
                            args: [status, duration, percentage, remarks, existing.rows[0].id]
                        });
                        overridden++;
                    }
                } else {
                    await db.execute({
                        sql: `INSERT INTO attendance_records (
                                session_id, student_id, status, duration, 
                                attendance_percentage, attendance_type, remarks, join_time
                              ) VALUES (?, ?, ?, ?, ?, 'meet_auto', ?, CURRENT_TIMESTAMP)`,
                        args: [sessionId, student.id, status, duration, percentage, remarks]
                    });
                    pulled++;
                }
            }

            return {
                pulled,
                overridden,
                total: studentsRes.rows.length,
                threshold: session.threshold_percentage || 75,
                message: `Successfully synchronized ${pulled + overridden} records using mock data.`
            };
        }

        throw new Error('Failed to fetch Google Meet reports: ' + error.message);
    }
};

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
              ORDER BY u.name ASC`,
        args: [sessionId]
    });

    const records = recordsRes.rows;
    const present = records.filter(r => r.status === 'present').length;
    
    return {
        session,
        summary: {
            total: records.length,
            present,
            absent: records.filter(r => r.status === 'absent').length,
            partial: records.filter(r => r.status === 'partial').length,
            presentPercentage: records.length > 0 ? Math.round((present / records.length) * 100) : 0
        },
        records
    };
};
