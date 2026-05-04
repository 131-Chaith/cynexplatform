import express from 'express';
import { db } from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get All Modules
// Get All Modules (Filtered for Students)
router.get('/', authenticateToken, async (req, res) => {
    try {
        let sql = "SELECT * FROM modules ORDER BY id DESC";
        let args = [];

        if (req.user.role === 'student') {
            try {
                // 1. Get user's batch_id
                const userRes = await db.execute({
                    sql: "SELECT batch_id FROM users WHERE id = ?",
                    args: [req.user.id]
                });
                const batchId = userRes.rows[0]?.batch_id;

                // 2. Build Query
                sql = `
                    SELECT DISTINCT m.* 
                    FROM modules m
                    JOIN course_modules cm ON m.id = cm.module_id
                    WHERE cm.course_id IN (SELECT course_id FROM enrollments WHERE student_id = ?)
                `;
                args = [req.user.id];

                if (batchId) {
                    sql += ` OR cm.course_id IN (SELECT course_id FROM batch_courses WHERE batch_id = ?)`;
                    args.push(batchId);
                }

                sql += ` ORDER BY m.id DESC`;
            } catch (innerErr) {
                console.error("Student module fetch fallback:", innerErr);
                sql = "SELECT * FROM modules ORDER BY id DESC"; // Fallback to all for now
                args = [];
            }
        }

        const result = await db.execute({ sql, args });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Create Module
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
    console.log("POST /modules called");
    console.log("User:", req.user);
    const { title, description } = req.body;
    console.log("Body:", req.body);
    try {
        await db.execute({
            sql: "INSERT INTO modules (course_id, title, description) VALUES (?, ?, ?)",
            args: [req.body.course_id || 0, title, description]
        });
        console.log("Module inserted successfully");
        res.status(201).json({ message: "Module Created Successfully" });
    } catch (error) {
        console.error("Error creating module:", error);
        res.status(500).json({ message: error.message });
    }
});
// Admin: Update Module
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { title, description } = req.body;
    try {
        await db.execute({
            sql: "UPDATE modules SET title = ?, description = ? WHERE id = ?",
            args: [title, description, req.params.id]
        });
        res.json({ message: "Module Updated Successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Admin: Delete Module
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const moduleId = req.params.id;
    try {
        // 1. Delete submissions related to assignments in this module
        await db.execute({
            sql: "DELETE FROM submissions WHERE assignment_id IN (SELECT id FROM assignments WHERE module_id = ?)",
            args: [moduleId]
        });

        // 2. Delete assignments in this module
        await db.execute({
            sql: "DELETE FROM assignments WHERE module_id = ?",
            args: [moduleId]
        });

        // 3. Delete test results related to mock tests in this module
        await db.execute({
            sql: "DELETE FROM test_results WHERE test_id IN (SELECT id FROM mock_tests WHERE module_id = ?)",
            args: [moduleId]
        });

        // 4. Delete mock tests in this module
        await db.execute({
            sql: "DELETE FROM mock_tests WHERE module_id = ?",
            args: [moduleId]
        });

        // 6. Delete related videos
        await db.execute({
            sql: "DELETE FROM videos WHERE module_id = ?",
            args: [moduleId]
        });

        // 7. Delete related classes (live sessions)
        await db.execute({
            sql: "DELETE FROM classes WHERE module_id = ?",
            args: [moduleId]
        });

        // 8. Finally delete the module (course_modules handles itself via CASCADE)
        await db.execute({
            sql: "DELETE FROM modules WHERE id = ?",
            args: [moduleId]
        });

        res.json({ message: "Module and all related curriculum/assessments deleted successfully" });
    } catch (error) {
        console.error("Delete module error:", error);
        res.status(500).json({ message: error.message });
    }
});

// -------------------------------------------------------------------------
// Assessment Routes (Nested under Modules)
// -------------------------------------------------------------------------

// Get Module Assignments
router.get('/:id/assignments', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'student') {
            // 1. Get user's batch_id
            const userRes = await db.execute({
                sql: "SELECT batch_id FROM users WHERE id = ?",
                args: [req.user.id]
            });
            const batchId = userRes.rows[0]?.batch_id;

            let sql = `SELECT 1 
                      FROM course_modules cm 
                      WHERE cm.module_id = ? AND (
                        cm.course_id IN (SELECT course_id FROM enrollments WHERE student_id = ?)`;
            let args = [req.params.id, req.user.id];

            if (batchId) {
                sql += ` OR cm.course_id IN (SELECT course_id FROM batch_courses WHERE batch_id = ?)`;
                args.push(batchId);
            }
            sql += `)`;

            const allowed = await db.execute({ sql, args });

            if (allowed.rows.length === 0) {
                return res.status(403).json({ message: "Access Denied: Not enrolled in this course module" });
            }
        }

        const result = await db.execute({
            sql: "SELECT * FROM assignments WHERE module_id = ?",
            args: [req.params.id]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Add Assignment to Module
router.post('/:id/assignments', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { title, description, due_date, type, problem_statement, starter_code, expected_output, difficulty, test_cases, course_id } = req.body;
    const moduleId = req.params.id;

    try {
        await db.execute({
            sql: "INSERT INTO assignments (module_id, course_id, title, description, due_date, type, problem_statement, starter_code, expected_output, difficulty, test_cases) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            args: [moduleId, course_id || null, title, description, due_date, type || 'standard', problem_statement || null, starter_code || null, expected_output || null, difficulty || 'Easy', test_cases || '[]']
        });
        res.status(201).json({ message: "Assignment Added Successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Module Mock Tests
router.get('/:id/tests', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'student') {
            // 1. Get user's batch_id
            const userRes = await db.execute({
                sql: "SELECT batch_id FROM users WHERE id = ?",
                args: [req.user.id]
            });
            const batchId = userRes.rows[0]?.batch_id;

            let sql = `SELECT 1 
                      FROM course_modules cm 
                      WHERE cm.module_id = ? AND (
                        cm.course_id IN (SELECT course_id FROM enrollments WHERE student_id = ?)`;
            let args = [req.params.id, req.user.id];

            if (batchId) {
                sql += ` OR cm.course_id IN (SELECT course_id FROM batch_courses WHERE batch_id = ?)`;
                args.push(batchId);
            }
            sql += `)`;

            const allowed = await db.execute({ sql, args });

            if (allowed.rows.length === 0) {
                return res.status(403).json({ message: "Access Denied: Not enrolled in this course module" });
            }
        }

        const result = await db.execute({
            sql: "SELECT * FROM mock_tests WHERE module_id = ?",
            args: [req.params.id]
        });

        // Parse questions JSON
        const tests = result.rows.map(test => ({
            ...test,
            questions: typeof test.questions === 'string' ? JSON.parse(test.questions) : test.questions
        }));

        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Add Mock Test to Module
router.post('/:id/tests', authenticateToken, authorizeRole('admin'), async (req, res) => {
    console.log("POST /modules/:id/tests called");
    console.log("Params:", req.params);
    console.log("Body:", req.body);
    const { title, duration, total_marks, type, questions, course_id } = req.body;
    const moduleId = req.params.id;

    try {
        await db.execute({
            sql: "INSERT INTO mock_tests (module_id, course_id, title, duration, total_marks, type, questions) VALUES (?, ?, ?, ?, ?, ?, ?)",
            args: [moduleId, course_id || null, title, duration, total_marks, type, JSON.stringify(questions)]
        });
        console.log("Mock test inserted successfully");
        res.status(201).json({ message: "Mock Test Added Successfully" });
    } catch (error) {
        console.error("Error adding mock test:", error);
        res.status(500).json({ message: error.message || "Internal Server Error" });
    }
});

export default router;
