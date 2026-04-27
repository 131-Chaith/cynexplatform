import express from 'express';
import { db } from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get My Projects (Student)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await db.execute({
            sql: "SELECT * FROM projects WHERE student_id = ?",
            args: [req.user.id]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Submit Project (Student)
router.post('/', authenticateToken, async (req, res) => {
    const { course_id, title, repo_link } = req.body;
    try {
        await db.execute({
            sql: "INSERT INTO projects (student_id, course_id, title, repo_link, status) VALUES (?, ?, ?, ?, 'pending')",
            args: [req.user.id, course_id, title, repo_link]
        });
        res.json({ message: "Project Submitted Successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Get Pending Projects
router.get('/pending', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT p.*, u.name as student_name, c.title as course_title 
            FROM projects p
            JOIN users u ON p.student_id = u.id
            JOIN courses c ON p.course_id = c.id
            WHERE p.status = 'pending'
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Approve Project
router.post('/approve/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const projectId = req.params.id;
    try {
        await db.execute({
            sql: "UPDATE projects SET status = 'approved' WHERE id = ?",
            args: [projectId]
        });
        res.json({ message: "Project Approved" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
