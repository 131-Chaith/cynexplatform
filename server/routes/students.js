import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Get Student Profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const result = await db.execute({
            sql: "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
            args: [req.user.id]
        });
        if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Student Profile (self)
router.put('/profile', authenticateToken, async (req, res) => {
    const { name, phone, address, dob, gender, institution, highest_qualification, year_of_passing, resume_link } = req.body;
    try {
        // Update name in users table
        if (name) {
            await db.execute({
                sql: "UPDATE users SET name = ? WHERE id = ?",
                args: [name, req.user.id]
            });
        }
        // Upsert student profile row
        const existing = await db.execute({
            sql: "SELECT id FROM students WHERE user_id = ?",
            args: [req.user.id]
        });
        if (existing.rows.length > 0) {
            await db.execute({
                sql: "UPDATE students SET phone = ?, address = ?, dob = ?, gender = ?, institution = ?, highest_qualification = ?, year_of_passing = ?, resume_link = ? WHERE user_id = ?",
                args: [phone || null, address || null, dob || null, gender || 'Male', institution || null, highest_qualification || null, year_of_passing || null, resume_link || null, req.user.id]
            });
        } else {
            await db.execute({
                sql: "INSERT INTO students (user_id, phone, address, dob, gender, institution, highest_qualification, year_of_passing, resume_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                args: [req.user.id, phone || null, address || null, dob || null, gender || 'Male', institution || null, highest_qualification || null, year_of_passing || null, resume_link || null]
            });
        }
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Update Profile Photo
router.post('/profile/photo', authenticateToken, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const filePath = `/uploads/${req.file.filename}`;
        await db.execute({
            sql: "UPDATE users SET profile_photo = ? WHERE id = ?",
            args: [filePath, req.user.id]
        });
        console.log(`[ProfileDebug] Photo uploaded for ${req.user.id}: ${filePath}`);
        res.json({ message: 'Photo updated successfully', photoUrl: filePath });
    } catch (error) {
        console.error('[PhotoUploadError]', error);
        res.status(500).json({ message: error.message });
    }
});

// Update Resume File
router.post('/profile/resume', authenticateToken, (req, res, next) => {
    upload.single('resume')(req, res, (err) => {
        if (err) return res.status(400).json({ message: 'Upload error: ' + err.message });
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No resume file uploaded' });
        
        const host = req.get('host');
        const protocol = req.protocol;
        const filePath = `${protocol}://${host}/uploads/${req.file.filename}`;

        // Update link in students table
        const existing = await db.execute({
            sql: "SELECT id FROM students WHERE user_id = ?",
            args: [req.user.id]
        });

        if (existing.rows.length > 0) {
            await db.execute({
                sql: "UPDATE students SET resume_link = ? WHERE user_id = ?",
                args: [filePath, req.user.id]
            });
        } else {
            await db.execute({
                sql: "INSERT INTO students (user_id, resume_link, gender) VALUES (?, ?, 'Male')",
                args: [req.user.id, filePath]
            });
        }

        console.log(`[ProfileDebug] Resume uploaded for ${req.user.id}: ${filePath}`);
        res.json({ message: 'Resume uploaded successfully', resumeUrl: filePath });
    } catch (error) {
        console.error('[ResumeUploadError]', error);
        res.status(500).json({ message: error.message });
    }
});


// Get Enrolled Courses
router.get('/courses', authenticateToken, async (req, res) => {
    try {
        const result = await db.execute({
            sql: `SELECT c.* 
                  FROM courses c 
                  JOIN enrollments e ON c.id = e.course_id 
                  WHERE e.student_id = ?`,
            args: [req.user.id]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Submit Assignment
router.post('/assignments/submit', authenticateToken, async (req, res) => {
    try {
        const { assignment_id, submission_link, submission_code, score, type, language } = req.body;
        const studentId = req.user && req.user.id ? req.user.id : null;

        // LibSQL is EXTREMELY strict: if any value in the args array is 'undefined', it throws "Unsupported type of value"
        // We must map everything to a valid primitive (String, Number, or Null).
        const sanitize = (val) => (val === undefined || val === null) ? null : val;

        const cleanId = assignment_id ? String(assignment_id) : null;
        const cleanScore = isNaN(Number(score)) ? 0 : Number(score);
        
        const finalArgs = [
            sanitize(cleanId),
            sanitize(studentId),
            sanitize(submission_link),
            sanitize(submission_code),
            sanitize(cleanScore),
            sanitize(type || 'standard'),
            sanitize(language || 'javascript')
        ];

        console.log(`[SubmitDebug] Student: ${studentId}, Args: ${finalArgs.map(val => typeof val).join(', ')}`);

        // Guard: Ensure student record exists in 'students' table to avoid FK constraint failure
        const studentExists = await db.execute({
            sql: "SELECT 1 FROM students WHERE user_id = ?",
            args: [sanitize(studentId)]
        });

        if (studentExists.rows.length === 0) {
            console.log(`[SubmitGuard] Creating missing student profile for user ${studentId}`);
            await db.execute({
                sql: "INSERT INTO students (user_id, dob, gender) VALUES (?, ?, ?)",
                args: [sanitize(studentId), null, 'Male']
            });
        }

        await db.execute({
            sql: "INSERT INTO submissions (assignment_id, student_id, submission_link, submission_code, score, type, language) VALUES (?, ?, ?, ?, ?, ?, ?)",
            args: finalArgs
        });
        
        res.json({ message: "Assignment Submitted Successfully" });
    } catch (error) {
        console.error("[SubmitErrorDetails]", error);
        res.status(500).json({ message: error.message || "Submission Failed" });
    }
});

// Submit Test Result
router.post('/tests/submit', authenticateToken, async (req, res) => {
    const { test_id, score, total_questions, answers } = req.body;
    try {
        await db.execute({
            sql: "INSERT INTO test_results (test_id, student_id, score, total_questions, answers) VALUES (?, ?, ?, ?, ?)",
            args: [test_id, req.user.id, score, total_questions, JSON.stringify(answers || [])]
        });
        res.json({ message: "Test Result Saved" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Request Certificate
router.post('/certificates/request', authenticateToken, (req, res, next) => {
    upload.single('video')(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ message: 'File upload error: ' + err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        console.log('--- Incoming Certificate Request ---');
        console.log('Headers:', req.headers);
        console.log('Body:', JSON.stringify(req.body));
        console.log('File:', req.file ? req.file.filename : 'No file');

        let { course_id, video_link } = req.body;
        
        // Handle cases where 'video' field is sent as text (e.g. from JSON serialization bug or simulation)
        if (!video_link && req.body.video) {
            if (typeof req.body.video === 'string' && req.body.video.length > 0) {
                video_link = req.body.video;
            } else if (typeof req.body.video === 'object' && Object.keys(req.body.video).length === 0) {
                console.log('Detected empty video object in body - ignoring it');
                // Don't assign to video_link
            }
        }

        // If a file was uploaded, construct its URL
        if (req.file) {
            const host = req.get('host');
            const protocol = req.protocol;
            video_link = `${protocol}://${host}/uploads/${req.file.filename}`;
        }

        if (!video_link) {
            return res.status(400).json({ message: 'Video file or link is required' });
        }

        // Use integers for IDs just in case the driver is strict
        const studentId = parseInt(req.user.id);
        const courseId = parseInt(course_id);

        if (isNaN(courseId)) {
            return res.status(400).json({ message: 'Invalid course ID' });
        }

        await db.execute({
            sql: "INSERT INTO certificate_requests (student_id, course_id, video_link) VALUES (?, ?, ?)",
            args: [studentId, courseId, video_link]
        });
        
        console.log('✅ Certificate request saved successfully');
        res.json({ message: "Certificate Requested Successfully", video_link: video_link });
    } catch (error) {
        console.error('Certificate request failed:', error);
        res.status(500).json({ message: 'Internal server error: ' + error.message });
    }
});

// Get My Certificates
router.get('/certificates', authenticateToken, async (req, res) => {
    try {
        const result = await db.execute({
            sql: `SELECT c.*, co.title as course_title 
                  FROM certificates c 
                  JOIN courses co ON c.course_id = co.id 
                  WHERE c.student_id = ?`,
            args: [req.user.id]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Helper: get enrolled course IDs for a student
async function getEnrolledCourseIds(studentId) {
    const res = await db.execute({
        sql: `
            SELECT course_id FROM enrollments WHERE student_id = ?
            UNION
            SELECT course_id FROM batch_courses WHERE batch_id = (SELECT batch_id FROM users WHERE id = ?)
        `,
        args: [studentId, studentId]
    });
    
    return res.rows.map(r => r.course_id);
}

// Get Available Assignments (filtered by enrolled courses — both course-level and module-level)
router.get('/assignments', authenticateToken, async (req, res) => {
    try {
        const courseIds = await getEnrolledCourseIds(req.user.id);
        console.log(`[AssignDebug] Student ${req.user.id} Enrolled Course IDs:`, courseIds);
        if (courseIds.length === 0) return res.json([]);

        const placeholders = courseIds.map(() => '?').join(',');
        // Fetch course-level assignments AND module-level assignments (linked via module_id)
        const result = await db.execute({
            sql: `SELECT a.*, c.title as course_title, NULL as module_title
                  FROM assignments a
                  JOIN courses c ON a.course_id = c.id
                  WHERE a.course_id IN (${placeholders}) AND (a.module_id IS NULL OR a.module_id = '')
                  UNION
                  SELECT DISTINCT a.*, c.title as course_title, m.title as module_title
                  FROM assignments a
                  JOIN modules m ON a.module_id = m.id
                  JOIN course_modules cm ON m.id = cm.module_id
                  JOIN courses c ON cm.course_id = c.id
                  WHERE (a.course_id IN (${placeholders}) OR cm.course_id IN (${placeholders})) 
                  AND a.module_id IS NOT NULL AND a.module_id != ''
                  ORDER BY due_date ASC`,
            args: [...courseIds, ...courseIds, ...courseIds]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Available Mock Tests (filtered by enrolled courses — both course-level and module-level)
router.get('/tests', authenticateToken, async (req, res) => {
    try {
        const courseIds = await getEnrolledCourseIds(req.user.id);
        if (courseIds.length === 0) return res.json([]);

        const placeholders = courseIds.map(() => '?').join(',');
        // Fetch course-level tests AND module-level tests (linked via module_id)
        const result = await db.execute({
            sql: `SELECT t.*, c.title as course_title, NULL as module_title
                  FROM mock_tests t
                  JOIN courses c ON t.course_id = c.id
                  WHERE t.course_id IN (${placeholders}) AND (t.module_id IS NULL OR t.module_id = '')
                  UNION
                  SELECT DISTINCT t.*, c.title as course_title, m.title as module_title
                  FROM mock_tests t
                  JOIN modules m ON t.module_id = m.id
                  JOIN course_modules cm ON m.id = cm.module_id
                  JOIN courses c ON cm.course_id = c.id
                  WHERE (t.course_id IN (${placeholders}) OR cm.course_id IN (${placeholders}))
                  AND t.module_id IS NOT NULL AND t.module_id != ''
                  ORDER BY id ASC`,
            args: [...courseIds, ...courseIds, ...courseIds]
        });

        // Parse questions JSON
        const all = result.rows.map(t => ({
            ...t,
            questions: typeof t.questions === 'string' ? JSON.parse(t.questions || '[]') : (t.questions || [])
        }));

        res.json(all);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get My Test Results (with course/module info)
router.get('/test-results', authenticateToken, async (req, res) => {
    try {
        const result = await db.execute({
            sql: `SELECT tr.*, u.name as student_name, t.title as test_title, t.questions, 
                         c.title as course_title, m.title as module_title
                  FROM test_results tr
                  JOIN users u ON tr.student_id = u.id
                  JOIN mock_tests t ON tr.test_id = t.id
                  LEFT JOIN modules m ON t.module_id = m.id
                  LEFT JOIN courses c ON (t.course_id = c.id OR m.course_id = c.id)
                  WHERE tr.student_id = ?
                  ORDER BY tr.completed_at DESC`,
            args: [req.user.id]
        });

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

// Get My Certificate Requests
router.get('/certificates/requests', authenticateToken, async (req, res) => {
    try {
        const result = await db.execute({
            sql: `SELECT cr.*, c.title as course_title 
                  FROM certificate_requests cr
                  JOIN courses c ON cr.course_id = c.id
                  WHERE cr.student_id = ?`,
            args: [req.user.id]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get My Submissions
router.get('/submissions', authenticateToken, async (req, res) => {
    try {
        const result = await db.execute({
            sql: "SELECT * FROM submissions WHERE student_id = ?",
            args: [req.user.id]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get All Classes from Enrolled Courses
router.get('/classes', authenticateToken, async (req, res) => {
    try {
        const courseIds = await getEnrolledCourseIds(req.user.id);
        if (courseIds.length === 0) return res.json([]);

        const placeholders = courseIds.map(() => '?').join(',');

        const classesResult = await db.execute({
            sql: `SELECT cl.*, c.title as course_title, c.id as course_id
                  FROM classes cl
                  JOIN courses c ON cl.course_id = c.id
                  WHERE cl.course_id IN (${placeholders})`,
            args: courseIds
        });

        const videosResult = await db.execute({
            sql: `SELECT v.id, v.title, v.youtube_url as video_url, v.created_at as schedule, v.course_id, c.title as course_title
                  FROM videos v
                  JOIN courses c ON v.course_id = c.id
                  WHERE v.course_id IN (${placeholders})`,
            args: courseIds
        });

        const combined = [
            ...classesResult.rows.map(r => ({ ...r, unique_id: `class_${r.id}`, type: 'class' })),
            ...videosResult.rows.map(r => ({ ...r, unique_id: `video_${r.id}`, type: 'video' }))
        ].sort((a, b) => new Date(b.schedule) - new Date(a.schedule));

        res.json(combined);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Student Full Profile (with batch and enrolled courses)
router.get('/profile-full', authenticateToken, async (req, res) => {
    try {
        console.log(`[ProfileDebug] Fetching full profile for student ID: ${req.user.id}`);
        // 1. Basic user info
        const userRes = await db.execute({
            sql: "SELECT id, name, email, role, created_at, profile_photo FROM users WHERE id = ?",
            args: [req.user.id]
        });
        const user = userRes.rows[0];
        if (!user) {
            console.log(`[ProfileDebug] User NOT found: ${req.user.id}`);
            return res.status(404).json({ message: 'User not found' });
        }
        console.log(`[ProfileDebug] Found user: ${user.name} (${user.role})`);

        // 2. Student profile (phone, dob, gender, batch etc.)
        const profileRes = await db.execute({
            sql: `SELECT s.*, b.batch_name
                  FROM students s
                  LEFT JOIN batches b ON s.batch_id = b.id
                  WHERE s.user_id = ?`,
            args: [req.user.id]
        });
        const profile = profileRes.rows[0] || {};

        // 3. Enrolled courses
        const courseIds = await getEnrolledCourseIds(req.user.id);
        let enrolledCourses = [];
        if (courseIds.length > 0) {
            const placeholders = courseIds.map(() => '?').join(',');
            const coursesRes = await db.execute({
                sql: `SELECT id, title, description, duration FROM courses WHERE id IN (${placeholders})`,
                args: courseIds
            });
            enrolledCourses = coursesRes.rows;
        }

        // 4. Stats
        const submissionsRes = await db.execute({
            sql: "SELECT COUNT(*) as count FROM submissions WHERE student_id = ?",
            args: [req.user.id]
        });
        const testResultsRes = await db.execute({
            sql: "SELECT COUNT(*) as count FROM test_results WHERE student_id = ?",
            args: [req.user.id]
        });
        const certsRes = await db.execute({
            sql: "SELECT COUNT(*) as count FROM certificates WHERE student_id = ?",
            args: [req.user.id]
        });

        res.json({
            user,
            profile,
            enrolledCourses,
            stats: {
                totalCourses: enrolledCourses.length,
                totalSubmissions: Number(submissionsRes.rows[0]?.count || 0),
                totalTests: Number(testResultsRes.rows[0]?.count || 0),
                totalCertificates: Number(certsRes.rows[0]?.count || 0),
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;

