import express from 'express';
import { db } from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Helper for logging actions
const logAdminAction = async (userId, action, module, details) => {
    try {
        await db.execute({
            sql: "INSERT INTO audit_logs (user_id, action, module, details) VALUES (?, ?, ?, ?)",
            args: [userId, action, module, JSON.stringify(details)]
        });
    } catch (e) {
        console.error("Audit log failed:", e);
    }
};

// Get All Students
router.get('/students', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT 
                u.id as id, u.name, u.email, u.role, u.created_at, u.batch_id,
                s.phone, s.dob, s.address, s.gender, s.guardian_name, s.guardian_contact, s.previous_qualification,
                (SELECT GROUP_CONCAT(c.title, ', ') 
                 FROM enrollments e 
                 JOIN courses c ON e.course_id = c.id 
                 WHERE e.student_id = u.id) as enrolled_courses,
                b.batch_name as batch_name
            FROM users u
            LEFT JOIN students s ON u.id = s.user_id
            LEFT JOIN batches b ON u.batch_id = b.id
            WHERE u.role = 'student'
            ORDER BY u.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("Error in GET /admin/students:", error);
        res.status(500).json({ message: error.message });
    }
});

// Get All Issued Certificates (Admin)
router.get('/certificates-all', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT cert.*, u.name as student_name, co.title as course_title, b.batch_name
            FROM certificates cert
            JOIN users u ON cert.student_id = u.id
            JOIN courses co ON cert.course_id = co.id
            LEFT JOIN batches b ON u.batch_id = b.id
            ORDER BY cert.issue_date DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create Student (User + Profile)
router.post('/students', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const {
        name, email, password, phone, dob, address, gender,
        guardian_name, guardian_contact, previous_qualification
    } = req.body;

    try {
        // 1. Create User
        // Note: Password hashing should ultimately be reusable, but doing here for now to keep it self-contained or import bcrypt
        // We need auth.js imports or replicate hashing here. Let's assume we import bcrypt.
        // Actually, let's keep it simple and assume standard bcrypt usage.

        // Check if user exists
        const userCheck = await db.execute({ sql: "SELECT * FROM users WHERE email = ?", args: [email] });
        if (userCheck.rows.length > 0) return res.status(400).json({ message: "User already exists" });

        // We need to hash password
        const hashedPassword = await import('bcryptjs').then(bcrypt => bcrypt.hash(password, 10));

        const userResult = await db.execute({
            sql: "INSERT INTO users (name, email, password, role, batch_id) VALUES (?, ?, ?, 'student', ?) RETURNING id",
            args: [name, email, hashedPassword, req.body.batch_id || null]
        });

        // Turso/SQLite might not support RETURNING in all drivers or versions easily via execute depending on library.
        // If RETURNING not supported, we fetch by email.
        // Assuming result.lastInsertRowid might be available if using some drivers, but standard execute here returns rows.

        let userId;
        if (userResult.rows && userResult.rows.length > 0) {
            userId = userResult.rows[0].id;
        } else {
            // Fallback fetch
            const newUser = await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [email] });
            userId = newUser.rows[0].id;
        }

        // 2. Create Student Profile
        await db.execute({
            sql: `INSERT INTO students (
                user_id, phone, dob, address, gender, 
                guardian_name, guardian_contact, previous_qualification, batch_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                userId,
                phone || null,
                dob || null,
                address || null,
                gender || 'Male',
                guardian_name || null,
                guardian_contact || null,
                previous_qualification || null,
                req.body.batch_id || null // Ensure empty string becomes null
            ]
        });

        // 3. Optional: Enroll in Course
        if (req.body.course_id) {
            await db.execute({
                sql: "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)",
                args: [userId, req.body.course_id]
            });
        }

        res.status(201).json({ message: "Student Created & Enrolled Successfully" });

    } catch (error) {
        console.error("Create Student Failed:", error);
        res.status(500).json({ message: error.message });
    }
});

// Enroll Student in Course
router.post('/enroll', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { student_id, course_id } = req.body;
    try {
        // Check if already enrolled
        const existing = await db.execute({
            sql: "SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?",
            args: [student_id, course_id]
        });

        if (existing.rows.length > 0) {
            return res.status(409).json({ message: "Student is already enrolled in this course" });
        }

        await db.execute({
            sql: "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)",
            args: [student_id, course_id]
        });
        res.json({ message: "Student Enrolled Successfully" });
    } catch (error) {
        console.error("Enrollment error:", error);
        res.status(500).json({ message: "Enrollment failed: " + error.message });
    }
});

// Unenroll Student from Course
router.delete('/enroll/:studentId/:courseId', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { studentId, courseId } = req.params;
    try {
        await db.execute({
            sql: "DELETE FROM enrollments WHERE student_id = ? AND course_id = ?",
            args: [studentId, courseId]
        });
        res.json({ message: "Student Unenrolled Successfully" });
    } catch (error) {
        console.error("Unenrollment error:", error);
        res.status(500).json({ message: "Unenrollment failed: " + error.message });
    }
});

// Get Student Enrollments
router.get('/students/:id/enrollments', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const result = await db.execute({
            sql: `SELECT c.id, c.title 
                  FROM enrollments e 
                  JOIN courses c ON e.course_id = c.id 
                  WHERE e.student_id = ?`,
            args: [req.params.id]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get All Certificate Requests
router.get('/certificates/requests', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT cr.*, u.name as student_name, c.title as course_title, b.batch_name
            FROM certificate_requests cr
            JOIN users u ON cr.student_id = u.id
            JOIN courses c ON cr.course_id = c.id
            LEFT JOIN batches b ON u.batch_id = b.id
            ORDER BY cr.request_date DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Approve Certificate
router.post('/certificates/approve/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const requestId = req.params.id;
    try {
        // 1. Update request status
        await db.execute({
            sql: "UPDATE certificate_requests SET status = 'approved' WHERE id = ?",
            args: [requestId]
        });

        // 2. Fetch request details to create certificate
        const reqResult = await db.execute({
            sql: "SELECT * FROM certificate_requests WHERE id = ?",
            args: [requestId]
        });

        if (reqResult.rows.length === 0) return res.status(404).json({ message: "Request not found" });
        const request = reqResult.rows[0];

        // 3. Issue Certificate
        await db.execute({
            sql: "INSERT INTO certificates (student_id, course_id) VALUES (?, ?)",
            args: [request.student_id, request.course_id]
        });

        // 4. Notify Student
        await db.execute({
            sql: "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
            args: [request.student_id, "Certificate Approved", "Your certificate request has been approved and issued.", "success"]
        });

        res.json({ message: "Certificate Approved and Issued" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Reject Certificate
router.post('/certificates/reject/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const requestId = req.params.id;
    const { reason } = req.body; // Expecting a reason from admin
    try {
        await db.execute({
            sql: "UPDATE certificate_requests SET status = 'rejected', admin_feedback = ? WHERE id = ?",
            args: [reason || "Your video submission did not meet the requirements.", requestId]
        });

        // Fetch request details to notify student
        const reqResult = await db.execute({
            sql: "SELECT student_id FROM certificate_requests WHERE id = ?",
            args: [requestId]
        });

        if (reqResult.rows.length > 0) {
            const studentId = reqResult.rows[0].student_id;
            await db.execute({
                sql: "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
                args: [studentId, "Certificate Rejected", reason || "Your video submission did not meet the requirements.", "error"]
            });
        }

        res.json({ message: "Certificate Rejected" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Update Student
router.put('/students/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const {
        name, email, password, phone, dob, address, gender,
        guardian_name, guardian_contact, previous_qualification, batch_id
    } = req.body;
    const userId = req.params.id;

    try {
        // 0. Validate batch_id if provided
        if (batch_id) {
            const batchCheck = await db.execute({
                sql: "SELECT id FROM batches WHERE id = ?",
                args: [batch_id]
            });
            if (batchCheck.rows.length === 0) {
                return res.status(400).json({ message: "Invalid Batch ID selected. The batch does not exist." });
            }
        }

        // 1. Update User table
        // Fetch current user details to see if email/name changed
        const currentUser = await db.execute({
            sql: "SELECT name, email FROM users WHERE id = ?",
            args: [userId]
        });

        if (currentUser.rows.length === 0) return res.status(404).json({ message: "User not found" });
        const user = currentUser.rows[0];

        const nameToUpdate = name || user.name;
        const emailToUpdate = email || user.email;

        // Handle password update if provided and not the placeholder
        if (password && password !== '*****') {
            const hashedPassword = await import('bcryptjs').then(bcrypt => bcrypt.hash(password, 10));
            await db.execute({
                sql: "UPDATE users SET name = ?, email = ?, password = ?, batch_id = ? WHERE id = ?",
                args: [nameToUpdate, emailToUpdate, hashedPassword, batch_id || null, userId]
            });
        } else {
            await db.execute({
                sql: "UPDATE users SET name = ?, email = ?, batch_id = ? WHERE id = ?",
                args: [nameToUpdate, emailToUpdate, batch_id || null, userId]
            });
        }

        // 2. Update Student Profile (UPSERT)
        const profileCheck = await db.execute("SELECT id FROM students WHERE user_id = ?", [userId]);
        console.log(`Profile check for user ${userId}:`, profileCheck.rows);
        if (profileCheck.rows.length > 0) {
            console.log('Updating existing profile with:', { phone, dob, address, gender, guardian_name, guardian_contact, previous_qualification, batch_id });
            const profileRes = await db.execute({
                sql: `UPDATE students SET 
                    phone = ?, dob = ?, address = ?, gender = ?, 
                    guardian_name = ?, guardian_contact = ?, previous_qualification = ?,
                    batch_id = ?
                    WHERE user_id = ?`,
                args: [phone, dob, address, gender, guardian_name, guardian_contact, previous_qualification, batch_id || null, userId]
            });
            console.log('Profile update result:', profileRes);
        } else {
            console.log('Inserting new profile...');
            await db.execute({
                sql: `INSERT INTO students (
                    user_id, phone, dob, address, gender, 
                    guardian_name, guardian_contact, previous_qualification, batch_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [userId, phone || null, dob || null, address || null, gender || 'Male', guardian_name || null, guardian_contact || null, previous_qualification || null, batch_id || null]
            });
        }

        // 3. Optional: Enroll in Course if provided
        if (req.body.course_id) {
            const existingEnrollment = await db.execute({
                sql: "SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?",
                args: [userId, req.body.course_id]
            });
            if (existingEnrollment.rows.length === 0) {
                await db.execute({
                    sql: "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)",
                    args: [userId, req.body.course_id]
                });
            }
        }

        res.json({ message: "Student Updated Successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Student
router.delete('/students/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const userId = req.params.id;
    try {
        console.log(`[TERMINATION] Starting full purge for Operative ID: ${userId}`);

        // 1. Delete Attendance Data (Comprehensive)
        const attendanceTables = ['attendance_records', 'attendance', 'qr_attendance_records'];
        for (const table of attendanceTables) {
            try {
                await db.execute({
                    sql: `DELETE FROM ${table} WHERE student_id = ?`,
                    args: [userId]
                });
            } catch (e) {
                console.warn(`[TERMINATION] Table ${table} might not have student_id or doesn't exist:`, e.message);
            }
        }

        // 2. Delete Course & Academic Data
        await db.execute({ sql: "DELETE FROM enrollments WHERE student_id = ?", args: [userId] });
        await db.execute({ sql: "DELETE FROM submissions WHERE student_id = ?", args: [userId] });
        await db.execute({ sql: "DELETE FROM test_results WHERE student_id = ?", args: [userId] });

        // 3. Delete Projects & Certification Requests
        await db.execute({ sql: "DELETE FROM projects WHERE student_id = ?", args: [userId] });
        await db.execute({ sql: "DELETE FROM certificate_requests WHERE student_id = ?", args: [userId] });
        await db.execute({ sql: "DELETE FROM certificates WHERE student_id = ?", args: [userId] });

        // 4. Delete Logs & Notifications
        await db.execute({ sql: "DELETE FROM activity_logs WHERE user_id = ?", args: [userId] });
        await db.execute({ sql: "DELETE FROM notifications WHERE user_id = ?", args: [userId] });

        // 5. Delete Profile Extension
        await db.execute({ sql: "DELETE FROM students WHERE user_id = ?", args: [userId] });

        // 6. Finally delete the core User Identity
        const result = await db.execute({
            sql: "DELETE FROM users WHERE id = ?",
            args: [userId]
        });

        console.log(`[TERMINATION] Purge successful for Operative ID: ${userId}`);
        res.json({ 
            status: 'success',
            message: "Operative Terminated and all associated data purged from the system." 
        });
    } catch (error) {
        console.error("CRITICAL: Termination Protocol Failed:", error);
        res.status(500).json({ 
            status: 'error',
            message: "Termination Failed: " + error.message 
        });
    }
});

// Get All Test Results (for all students)
router.get('/test-results', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT tr.*, u.name as student_name, b.batch_name, t.title as test_title, t.questions, 
                   c.title as course_title, m.title as module_title
            FROM test_results tr
            JOIN users u ON tr.student_id = u.id
            LEFT JOIN batches b ON u.batch_id = b.id
            JOIN mock_tests t ON tr.test_id = t.id
            LEFT JOIN modules m ON t.module_id = m.id
            LEFT JOIN courses c ON t.course_id = c.id
            ORDER BY tr.completed_at DESC
        `);

        // Parse questions and answers JSON for each result
        const results = result.rows.map(r => ({
            ...r,
            questions: typeof r.questions === 'string' ? JSON.parse(r.questions || '[]') : (r.questions || []),
            answers: typeof r.answers === 'string' ? JSON.parse(r.answers || '[]') : (r.answers || [])
        }));

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get All Assignment Submissions (for all students)
router.get('/submissions', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT s.*, u.name as student_name, b.batch_name, a.title as assignment_title, 
                   m.title as module_title, c.title as course_title
            FROM submissions s
            JOIN users u ON s.student_id = u.id
            LEFT JOIN batches b ON u.batch_id = b.id
            JOIN assignments a ON s.assignment_id = a.id
            LEFT JOIN modules m ON a.module_id = m.id
            LEFT JOIN courses c ON a.course_id = c.id
            ORDER BY s.submitted_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Admin: Delete Assignment
router.delete('/delete-assignment/:assignmentId', authenticateToken, authorizeRole('admin'), async (req, res) => {
    console.log(`DELETE /api/admin/delete-assignment/${req.params.assignmentId} called`);
    try {
        // Delete related submissions first
        await db.execute({
            sql: "DELETE FROM submissions WHERE assignment_id = ?",
            args: [req.params.assignmentId]
        });
        
        await db.execute({
            sql: "DELETE FROM assignments WHERE id = ?",
            args: [req.params.assignmentId]
        });
        res.json({ message: "Assignment and related submissions deleted successfully" });
    } catch (error) {
        console.error("Delete assignment error:", error);
        res.status(500).json({ message: error.message });
    }
});

// Admin: Delete Mock Test
router.delete('/delete-test/:testId', authenticateToken, authorizeRole('admin'), async (req, res) => {
    console.log(`DELETE /api/admin/delete-test/${req.params.testId} called`);
    try {
        // Delete related test results first
        await db.execute({
            sql: "DELETE FROM test_results WHERE test_id = ?",
            args: [req.params.testId]
        });

        await db.execute({
            sql: "DELETE FROM mock_tests WHERE id = ?",
            args: [req.params.testId]
        });
        res.json({ message: "Mock test and related results deleted successfully" });
    } catch (error) {
        console.error("Delete test error:", error);
        res.status(500).json({ message: error.message });
    }
});

// ---------------- Settings Management ----------------

// Get all settings
router.get('/settings', authenticateToken, async (req, res) => {
    try {
        const result = await db.execute("SELECT setting_key, setting_value FROM settings");
        const settings = {};
        result.rows.forEach(row => {
            try {
                settings[row.setting_key] = JSON.parse(row.setting_value);
            } catch {
                settings[row.setting_key] = row.setting_value;
            }
        });
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update settings
router.post('/settings', authenticateToken, async (req, res) => {
    try {
        const settings = req.body; // Expects key-value pairs
        
        for (const [key, value] of Object.entries(settings)) {
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            
            // Check if exists
            const existing = await db.execute({
                sql: "SELECT setting_key FROM settings WHERE setting_key = ?",
                args: [key]
            });
            
            if (existing.rows.length > 0) {
                await db.execute({
                    sql: "UPDATE settings SET setting_value = ? WHERE setting_key = ?",
                    args: [stringValue, key]
                });
            } else {
                await db.execute({
                    sql: "INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)",
                    args: [key, stringValue]
                });
            }
        }
        res.json({ message: "Settings saved successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- NEW DASHBOARD SETTINGS MODULES ---

// 1. User Management (All Roles)
router.get('/all-users', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const result = await db.execute("SELECT id, name, email, role, created_at, batch_id FROM users ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. Exam Management
router.get('/exams', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM exams ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/exams', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { title, duration_minutes, meet_link } = req.body;
    try {
        await db.execute({
            sql: "INSERT INTO exams (title, duration_minutes, meet_link) VALUES (?, ?, ?)",
            args: [title, duration_minutes, meet_link]
        });
        res.status(201).json({ message: "Exam created successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/exams/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        await db.execute({
            sql: "DELETE FROM exams WHERE id = ?",
            args: [req.params.id]
        });
        res.json({ message: "Exam deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. Audit Logs
router.get('/audit-logs', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT al.*, u.name as user_name 
            FROM audit_logs al 
            JOIN users u ON al.user_id = u.id 
            ORDER BY al.created_at DESC LIMIT 100
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 4. User Management (CRUD for all roles)
router.post('/users', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { name, email, role, batch_id } = req.body;
    try {
        const hashedPassword = await bcrypt.hash('Cynex@123', 10); // Default password
        await db.execute({
            sql: "INSERT INTO users (name, email, password, role, batch_id) VALUES (?, ?, ?, ?, ?)",
            args: [name, email, hashedPassword, role, batch_id || null]
        });
        await logAdminAction(req.user.id, `Created ${role}: ${name}`, 'User Management', { email, role });
        res.status(201).json({ message: "Operative onboarded." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/users/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        await db.execute({ sql: "DELETE FROM users WHERE id = ?", args: [req.params.id] });
        await logAdminAction(req.user.id, `Deleted User ID: ${req.params.id}`, 'User Management', {});
        res.json({ message: "Operative terminated." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/users/:id/lock', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { locked } = req.body;
    try {
        await db.execute({
            sql: "UPDATE users SET locked = ? WHERE id = ?",
            args: [locked ? 1 : 0, req.params.id]
        });
        await logAdminAction(req.user.id, `${locked ? 'Locked' : 'Unlocked'} User ID: ${req.params.id}`, 'Security', {});
        res.json({ message: "Protocol updated." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 5. Question Bank & Batch Sync (Hooks)
router.post('/question-bank/import', authenticateToken, authorizeRole('admin'), async (req, res) => {
    // Placeholder for actual file processing
    res.json({ message: "Assets integrated." });
});

router.post('/batches/:id/sync', authenticateToken, authorizeRole('admin'), async (req, res) => {
    // Placeholder for actual sync logic
    res.json({ message: "Batch synchronized." });
});

export default router;
