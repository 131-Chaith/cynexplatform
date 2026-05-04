import express from 'express';
import { db } from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper for Audit Logs
const logAction = async (userId, action, details) => {
    try {
        await db.execute({
            sql: "INSERT INTO audit_logs (user_id, action, module, details) VALUES (?, ?, ?, ?)",
            args: [userId, action, 'Announcements', JSON.stringify(details)]
        });
    } catch (e) {
        console.error("Failed to log action:", e);
    }
};

// Create In-App Notification
const createNotification = async (userId, title, message) => {
    try {
        await db.execute({
            sql: "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
            args: [userId, title, message, 'announcement']
        });
    } catch (e) {
        console.error("Failed to create notification:", e);
    }
};

// --- ADMIN ROUTES ---

// Get all announcements
router.get('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const result = await db.execute(`
            SELECT a.*, u.name as author_name 
            FROM announcements a
            LEFT JOIN users u ON a.created_by = u.id
            ORDER BY a.publish_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create announcement
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { title, message, target_type, target_id, status, publish_at } = req.body;
    try {
        const result = await db.execute({
            sql: "INSERT INTO announcements (title, message, target_type, target_id, status, publish_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
            args: [title, message, target_type, target_id || null, status || 'published', publish_at || new Date().toISOString(), req.user.id]
        });

        const announcementId = Number(result.lastInsertRowid); // BigInt → Number for JSON serialization

        // If published now, create notifications for target audience
        if (status === 'published' || !publish_at || new Date(publish_at) <= new Date()) {
            let userIds = [];
            if (target_type === 'all') {
                const users = await db.execute("SELECT id FROM users WHERE role = 'student'");
                userIds = users.rows.map(u => u.id);
            } else if (target_type === 'batch') {
                const users = await db.execute({
                    sql: "SELECT id FROM users WHERE batch_id = ?",
                    args: [target_id]
                });
                userIds = users.rows.map(u => u.id);
            } else if (target_type === 'individual') {
                userIds = [target_id];
            }

            for (const uid of userIds) {
                await createNotification(uid, title, message);
            }
        }

        await logAction(req.user.id, 'CREATE', { announcementId, title, target_type });
        res.status(201).json({ id: announcementId, message: "Announcement created" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update announcement
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { title, message, target_type, target_id, status, publish_at } = req.body;
    try {
        await db.execute({
            sql: "UPDATE announcements SET title = ?, message = ?, target_type = ?, target_id = ?, status = ?, publish_at = ? WHERE id = ?",
            args: [title, message, target_type, target_id || null, status, publish_at, req.params.id]
        });

        await logAction(req.user.id, 'UPDATE', { id: req.params.id, title });
        res.json({ message: "Announcement updated" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete announcement
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        await db.execute({
            sql: "DELETE FROM announcements WHERE id = ?",
            args: [req.params.id]
        });
        await logAction(req.user.id, 'DELETE', { id: req.params.id });
        res.json({ message: "Announcement deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- STUDENT ROUTES ---

// Get announcements for the logged-in student
router.get('/student', authenticateToken, async (req, res) => {
    try {
        // Fix: Use datetime('now', '+6 hours') to account for IST (UTC+5:30) timezone offset
        // so announcements posted from India always show up immediately.
        // Also CAST target_id to TEXT for safe string comparison in SQLite.
        const result = await db.execute({
            sql: `
                SELECT a.*, u.name as author_name 
                FROM announcements a
                LEFT JOIN users u ON a.created_by = u.id
                WHERE a.status = 'published' 
                AND datetime(a.publish_at) <= datetime('now', 'localtime')
                AND (
                    a.target_type = 'all'
                    OR (a.target_type = 'batch' AND CAST(a.target_id AS TEXT) = CAST(? AS TEXT))
                    OR (a.target_type = 'individual' AND CAST(a.target_id AS TEXT) = CAST(? AS TEXT))
                )
                ORDER BY a.publish_at DESC
            `,
            args: [String(req.user.batch_id || ''), String(req.user.id)]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
