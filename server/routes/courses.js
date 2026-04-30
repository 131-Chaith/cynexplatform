import express from 'express';
import { db } from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin: Get all classes across all courses
router.get('/classes/all', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT c.*, co.title as course_title 
            FROM classes c 
            JOIN courses co ON c.course_id = co.id 
            ORDER BY c.schedule DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all courses with enrollment status (Public or Student)
router.get('/all-catalog', authenticateToken, async (req, res) => {
    try {
        const courses = await db.execute("SELECT * FROM courses");
        
        let enrolledIds = new Set();
        let allocatedIds = new Set();

        if (req.user && req.user.role === 'student') {
            // 1. Direct Enrollments (The student actually clicked 'Enroll')
            const enrollments = await db.execute({
                sql: "SELECT course_id FROM enrollments WHERE student_id = ?",
                args: [req.user.id]
            });
            enrollments.rows.forEach(row => enrolledIds.add(row.course_id));
            
            // 2. Batch Allocations (Allocated by Admin, but not yet enrolled)
            const userRes = await db.execute({
                sql: "SELECT batch_id FROM users WHERE id = ?",
                args: [req.user.id]
            });
            const batchId = userRes.rows[0]?.batch_id;
            if (batchId) {
                const batchCourses = await db.execute({
                    sql: "SELECT course_id FROM batch_courses WHERE batch_id = ?",
                    args: [batchId]
                });
                batchCourses.rows.forEach(row => allocatedIds.add(row.course_id));
            }
        }
        
        const catalog = courses.rows.map(course => ({
            ...course,
            is_enrolled: enrolledIds.has(course.id),
            is_allocated: allocatedIds.has(course.id)
        }));
        
        res.json(catalog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all courses (Public or Student)
router.get('/', authenticateToken, async (req, res) => {
    try {
        let sql = "SELECT * FROM courses";
        let args = [];

        if (req.user.role === 'student' || req.user.email === 'student@gmail.com') {
            sql = `SELECT c.* FROM courses c WHERE c.id IN (SELECT course_id FROM enrollments WHERE student_id = ?)`;
            args = [req.user.id];
        }

        const result = await db.execute({ sql, args });
        res.json(result.rows);
    } catch (error) {
        console.error("Error in GET /api/courses:", error);
        res.status(500).json({ message: error.message });
    }
});

// Admin: Add Course with Linked Modules
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { title, description, duration, module_ids } = req.body;
    try {
        const result = await db.execute({
            sql: "INSERT INTO courses (title, description, duration) VALUES (?, ?, ?) RETURNING id",
            args: [title, description, duration]
        });

        const courseId = result.rows[0].id;

        // Link existing modules
        if (module_ids && Array.isArray(module_ids) && module_ids.length > 0) {
            for (const moduleId of module_ids) {
                await db.execute({
                    sql: "INSERT INTO course_modules (course_id, module_id) VALUES (?, ?)",
                    args: [courseId, moduleId]
                });
            }
        }

        res.status(201).json({ message: "Course Added Successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Add Class to Course
router.post('/:id/classes', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { title, video_url, schedule, module_id, topic, instructor_name } = req.body;
    const courseId = req.params.id;

    try {
        await db.execute({
            sql: "INSERT INTO classes (course_id, title, video_url, schedule, module_id, topic, instructor_name) VALUES (?, ?, ?, ?, ?, ?, ?)",
            args: [courseId, title, video_url, schedule, module_id || null, topic || null, instructor_name || null]
        });
        res.status(201).json({ message: "Class Added Successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Course Classes (Public/Student)
router.get('/:id/classes', authenticateToken, async (req, res) => {
    try {
        const result = await db.execute({
            sql: "SELECT * FROM classes WHERE course_id = ? ORDER BY schedule ASC",
            args: [req.params.id]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Delete Class
router.delete('/:id/classes/:classId', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        await db.execute({
            sql: "DELETE FROM classes WHERE id = ? AND course_id = ?",
            args: [req.params.classId, req.params.id]
        });
        res.json({ message: "Class deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Admin: Add Assignment to Course
router.post('/:id/assignments', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { title, description, due_date } = req.body;
    const courseId = req.params.id;

    try {
        await db.execute({
            sql: "INSERT INTO assignments (course_id, title, description, due_date) VALUES (?, ?, ?, ?)",
            args: [courseId, title, description, due_date]
        });
        res.status(201).json({ message: "Assignment Added Successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Add Mock Test to Course
router.post('/:id/tests', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { title, duration, total_marks, type, questions } = req.body;
    const courseId = req.params.id;

    try {
        await db.execute({
            sql: "INSERT INTO mock_tests (course_id, title, duration, total_marks, type, questions) VALUES (?, ?, ?, ?, ?, ?)",
            args: [courseId, title, duration, total_marks, type, JSON.stringify(questions)]
        });
        res.status(201).json({ message: "Mock Test Added Successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Course Assignments
router.get('/:id/assignments', authenticateToken, async (req, res) => {
    try {
        const result = await db.execute({
            sql: "SELECT * FROM assignments WHERE course_id = ?",
            args: [req.params.id]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Course Mock Tests
router.get('/:id/tests', authenticateToken, async (req, res) => {
    try {
        // We need to parse questions JSON if we want to return it as object, or frontend can parse
        // Let's just return rows, frontend will parse 'questions' field if it's a string
        const result = await db.execute({
            sql: "SELECT * FROM mock_tests WHERE course_id = ?",
            args: [req.params.id]
        });

        // Parse questions JSON for client convenience
        const tests = result.rows.map(test => ({
            ...test,
            questions: typeof test.questions === 'string' ? JSON.parse(test.questions) : test.questions
        }));

        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// -------------------------------------------------------------------------
// Module Routes
// -------------------------------------------------------------------------

// Admin: Add Module to Course
router.post('/:id/modules', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { title, description } = req.body;
    const courseId = req.params.id;

    try {
        await db.execute({
            sql: "INSERT INTO modules (course_id, title, description) VALUES (?, ?, ?)",
            args: [courseId, title, description]
        });
        res.status(201).json({ message: "Module Added Successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Course Modules (Linked)
router.get('/:id/modules', authenticateToken, async (req, res) => {
    try {
        const result = await db.execute({
            sql: `
                SELECT m.* FROM modules m
                JOIN course_modules cm ON m.id = cm.module_id
                WHERE cm.course_id = ?
            `,
            args: [req.params.id]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Update Course
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { title, description, duration, module_ids } = req.body;
    const courseId = req.params.id;
    try {
        await db.execute({
            sql: "UPDATE courses SET title = ?, description = ?, duration = ? WHERE id = ?",
            args: [title, description, duration, courseId]
        });

        // Update Modules (Delete existing links and re-add)
        if (module_ids) {
            await db.execute({
                sql: "DELETE FROM course_modules WHERE course_id = ?",
                args: [courseId]
            });

            if (Array.isArray(module_ids) && module_ids.length > 0) {
                for (const moduleId of module_ids) {
                    await db.execute({
                        sql: "INSERT INTO course_modules (course_id, module_id) VALUES (?, ?)",
                        args: [courseId, moduleId]
                    });
                }
            }
        }

        res.json({ message: "Course Updated Successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Course
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const courseId = req.params.id;
    console.log(`Attempting to delete course ID: ${courseId}`);
    try {
        // 1. Delete associated modules links
        console.log("Step 1: Deleting course_modules links...");
        await db.execute({
            sql: "DELETE FROM course_modules WHERE course_id = ?",
            args: [courseId]
        });

        // 2. Delete classes
        console.log("Step 2: Deleting classes...");
        await db.execute({
            sql: "DELETE FROM classes WHERE course_id = ?",
            args: [courseId]
        });

        // 3. Delete submissions first, then assignments
        console.log("Step 3: Deleting submissions and assignments...");
        await db.execute({
            sql: "DELETE FROM submissions WHERE assignment_id IN (SELECT id FROM assignments WHERE course_id = ?)",
            args: [courseId]
        });
        await db.execute({
            sql: "DELETE FROM assignments WHERE course_id = ?",
            args: [courseId]
        });

        // 4. Delete test results and questions first, then mock tests
        console.log("Step 4: Deleting test results, questions, and mock tests...");
        await db.execute({
            sql: "DELETE FROM test_results WHERE test_id IN (SELECT id FROM mock_tests WHERE course_id = ?)",
            args: [courseId]
        });
        await db.execute({
            sql: "DELETE FROM questions WHERE test_id IN (SELECT id FROM mock_tests WHERE course_id = ?)",
            args: [courseId]
        });
        await db.execute({
            sql: "DELETE FROM mock_tests WHERE course_id = ?",
            args: [courseId]
        });

        // 5. Delete projects
        console.log("Step 5: Deleting projects...");
        await db.execute({
            sql: "DELETE FROM projects WHERE course_id = ?",
            args: [courseId]
        });

        // 6. Delete certificate requests and certificates
        console.log("Step 6: Deleting certificate requests and certificates...");
        await db.execute({
            sql: "DELETE FROM certificate_requests WHERE course_id = ?",
            args: [courseId]
        });
        await db.execute({
            sql: "DELETE FROM certificates WHERE course_id = ?",
            args: [courseId]
        });

        // 7. Delete batch course links
        console.log("Step 7: Deleting batch_courses links...");
        await db.execute({
            sql: "DELETE FROM batch_courses WHERE course_id = ?",
            args: [courseId]
        });

        // 8. Delete enrollments
        console.log("Step 8: Deleting enrollments...");
        await db.execute({
            sql: "DELETE FROM enrollments WHERE course_id = ?",
            args: [courseId]
        });

        // 9. Finally, delete the course
        console.log("Step 9: Deleting the course itself...");
        await db.execute({
            sql: "DELETE FROM courses WHERE id = ?",
            args: [courseId]
        });

        console.log("Course deleted successfully!");
        res.json({ message: "Course Deleted Successfully" });
    } catch (error) {
        console.error("Delete course error at step:", error);
        res.status(500).json({
            message: `Failed to delete course: ${error.message}`,
            error: error.message
        });
    }
});

// Get Course Full Details (Classes, Modules, Assignments, Tests)
router.get('/:id/details', authenticateToken, async (req, res) => {
    const courseId = req.params.id;
    try {
        // 1. Check Access (Student)
        if (req.user.role === 'student') {
            const enrollRows = await db.execute({
                sql: "SELECT count(*) as count FROM enrollments WHERE student_id = ?",
                args: [req.user.id]
            });

            let accessGranted = false;
            if (Number(enrollRows.rows[0].count) > 0) {
                // If student has direct enrollments, they can ONLY access those
                const check = await db.execute({
                    sql: "SELECT 1 FROM enrollments WHERE student_id = ? AND course_id = ?",
                    args: [req.user.id, courseId]
                });
                accessGranted = check.rows.length > 0;
            } else {
                // Otherwise, check batch enrollment
                const userRes = await db.execute({
                    sql: "SELECT batch_id FROM users WHERE id = ?",
                    args: [req.user.id]
                });
                const batchId = userRes.rows[0]?.batch_id;
                if (batchId) {
                    const check = await db.execute({
                        sql: "SELECT 1 FROM batch_courses WHERE batch_id = ? AND course_id = ?",
                        args: [batchId, courseId]
                    });
                    accessGranted = check.rows.length > 0;
                }
            }

            if (!accessGranted) {
                return res.status(403).json({ message: "Access Denied" });
            }
        }

        // 2. Fetch Course Info
        const courseRes = await db.execute({
            sql: "SELECT * FROM courses WHERE id = ?",
            args: [courseId]
        });
        const course = courseRes.rows[0];
        if (!course) return res.status(404).json({ message: "Course not found" });

        // 3. Fetch Classes and Videos
        const classesRes = await db.execute({
            sql: "SELECT * FROM classes WHERE course_id = ? ORDER BY schedule ASC",
            args: [courseId]
        });

        const videosRes = await db.execute({
            sql: "SELECT * FROM videos WHERE course_id = ? ORDER BY created_at ASC",
            args: [courseId]
        });

        const combinedClasses = [
            ...classesRes.rows.map(r => ({ ...r, unique_id: `class_${r.id}`, type: 'class' })),
            ...videosRes.rows.map(r => ({ ...r, unique_id: `video_${r.id}`, type: 'video', video_url: r.youtube_url, schedule: r.created_at }))
        ].sort((a, b) => new Date(b.schedule) - new Date(a.schedule));

        // 4. Fetch Modules
        const modulesRes = await db.execute({
            sql: `
                SELECT m.* FROM modules m
                JOIN course_modules cm ON m.id = cm.module_id
                WHERE cm.course_id = ?
            `,
            args: [courseId]
        });
        const modules = modulesRes.rows;

        // 5. Fetch Assignments, Tests, and Videos for each module
        const modulesWithContent = await Promise.all(modules.map(async (mod) => {
            const assignments = await db.execute({
                sql: "SELECT * FROM assignments WHERE module_id = ?",
                args: [mod.id]
            });
            const tests = await db.execute({
                sql: "SELECT * FROM mock_tests WHERE module_id = ?",
                args: [mod.id]
            });
            const videos = await db.execute({
                sql: "SELECT * FROM videos WHERE module_id = ? ORDER BY order_index ASC",
                args: [mod.id]
            });

            // Parse test questions if needed
            const parsedTests = tests.rows.map(t => ({
                ...t,
                questions: typeof t.questions === 'string' ? JSON.parse(t.questions) : t.questions
            }));

            return {
                ...mod,
                assignments: assignments.rows,
                tests: parsedTests,
                videos: videos.rows
            };
        }));

        // 6. Fetch "Course-Direct" Assignments and Tests (if any exist not in modules)
        // (Our schema supports both, so let's fetch them too)
        const courseAssignments = await db.execute({
            sql: "SELECT * FROM assignments WHERE course_id = ?",
            args: [courseId]
        });
        const courseTestsRes = await db.execute({
            sql: "SELECT * FROM mock_tests WHERE course_id = ?",
            args: [courseId]
        });
        const courseTests = courseTestsRes.rows.map(t => ({
            ...t,
            questions: typeof t.questions === 'string' ? JSON.parse(t.questions) : t.questions
        }));


        res.json({
            course,
            classes: combinedClasses,
            modules: modulesWithContent,
            courseAssignments: courseAssignments.rows,
            courseTests: courseTests
        });

    } catch (error) {
        console.error("Error fetching course details:", error);
        res.status(500).json({ message: error.message });
    }
});

export default router;

