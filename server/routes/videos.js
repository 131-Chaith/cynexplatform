import express from 'express';
import { db } from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get All Videos (with optional filtering)
// Get All Videos (with optional filtering)
router.get('/', authenticateToken, async (req, res) => {
    const { course_id, module_id, batch_id } = req.query;

    try {
        let sql = "SELECT * FROM videos";
        let args = [];
        let conditions = [];

        // Role-based filtering for students
        if (req.user.role === 'student') {
            const userRes = await db.execute({
                sql: "SELECT batch_id FROM users WHERE id = ?",
                args: [req.user.id]
            });
            const userBatchId = userRes.rows[0]?.batch_id;

            if (userBatchId) {
                conditions.push("(batch_id IS NULL OR batch_id = ?)");
                args.push(userBatchId);
            } else {
                conditions.push("batch_id IS NULL");
            }

            conditions.push(`
                (course_id IN (SELECT course_id FROM enrollments WHERE student_id = ?)
                OR course_id IN (SELECT course_id FROM batch_courses WHERE batch_id = ?))
            `);
            args.push(req.user.id, userBatchId);
        }

        if (course_id) {
            conditions.push("course_id = ?");
            args.push(course_id);
        }

        if (module_id) {
            conditions.push("module_id = ?");
            args.push(module_id);
        }

        if (batch_id) {
            conditions.push("batch_id = ?");
            args.push(batch_id);
        }

        if (conditions.length > 0) {
            sql += " WHERE " + conditions.join(" AND ");
        }

        sql += " ORDER BY order_index ASC, created_at DESC";

        const result = await db.execute({ sql, args });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Single Video
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await db.execute({
            sql: "SELECT * FROM videos WHERE id = ?",
            args: [req.params.id]
        });

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Video not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create Video (Admin only)
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { title, description, youtube_url, course_id, module_id, batch_id, duration, order_index } = req.body;

    if (!title || !youtube_url) {
        return res.status(400).json({ message: "Title and YouTube URL are required" });
    }

    try {
        await db.execute({
            sql: `INSERT INTO videos (title, description, youtube_url, course_id, module_id, batch_id, duration, order_index) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [title, description || null, youtube_url, course_id || null, module_id || null, batch_id || null, duration || null, order_index || 0]
        });

        res.status(201).json({ message: "Video created successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Video (Admin only)
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { title, description, youtube_url, course_id, module_id, batch_id, duration, order_index } = req.body;

    if (!title || !youtube_url) {
        return res.status(400).json({ message: "Title and YouTube URL are required" });
    }

    try {
        await db.execute({
            sql: `UPDATE videos 
                  SET title = ?, description = ?, youtube_url = ?, course_id = ?, module_id = ?, batch_id = ?, duration = ?, order_index = ?
                  WHERE id = ?`,
            args: [title, description || null, youtube_url, course_id || null, module_id || null, batch_id || null, duration || null, order_index || 0, req.params.id]
        });

        res.json({ message: "Video updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Video (Admin only)
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        await db.execute({
            sql: "DELETE FROM videos WHERE id = ?",
            args: [req.params.id]
        });

        res.json({ message: "Video deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
