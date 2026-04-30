import express from 'express';
import { db } from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get All Batches
router.get('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM batches ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (error) {
        console.error("Error in GET /api/batches:", error);
        res.status(500).json({ message: error.message });
    }
});

// Create Batch
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { batch_name, start_date, end_date } = req.body;
    try {
        await db.execute({
            sql: "INSERT INTO batches (batch_name, start_date, end_date) VALUES (?, ?, ?)",
            args: [batch_name, start_date, end_date]
        });
        // Log activity (Placeholder for now)
        res.status(201).json({ message: "Batch Created Successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Batch
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { batch_name, start_date, end_date } = req.body;
    try {
        await db.execute({
            sql: "UPDATE batches SET batch_name = ?, start_date = ?, end_date = ? WHERE id = ?",
            args: [batch_name, start_date, end_date, req.params.id]
        });
        res.json({ message: "Batch Updated Successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Batch
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const batchId = req.params.id;
    try {
        // 1. Unlink students from this batch in both tables
        await db.execute({
            sql: "UPDATE users SET batch_id = NULL WHERE batch_id = ?",
            args: [batchId]
        });
        await db.execute({
            sql: "UPDATE students SET batch_id = NULL WHERE batch_id = ?",
            args: [batchId]
        });

        // 2. Delete batch-course associations
        await db.execute({
            sql: "DELETE FROM batch_courses WHERE batch_id = ?",
            args: [batchId]
        });

        // 3. Finally delete the batch
        await db.execute({
            sql: "DELETE FROM batches WHERE id = ?",
            args: [batchId]
        });
        res.json({ message: "Batch Deleted Successfully" });
    } catch (error) {
        console.error("Delete batch error:", error);
        res.status(500).json({ message: error.message });
    }
});

// Assign Course to Batch
router.post('/:id/courses', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { course_id } = req.body;
    try {
        await db.execute({
            sql: "INSERT INTO batch_courses (batch_id, course_id) VALUES (?, ?)",
            args: [req.params.id, course_id]
        });
        res.json({ message: "Course Assigned to Batch" });
    } catch (error) {
        res.status(500).json({ message: "Failed to assign course (possibly already assigned)" });
    }
});

// Get Courses for a Batch
router.get('/:id/courses', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const result = await db.execute({
            sql: `SELECT c.* FROM courses c 
                  INNER JOIN batch_courses bc ON c.id = bc.course_id 
                  WHERE bc.batch_id = ?`,
            args: [req.params.id]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Students in a Batch
router.get('/:id/students', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const result = await db.execute({
            sql: "SELECT * FROM users WHERE batch_id = ? AND role = 'student'",
            args: [req.params.id]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Assign Students to Batch (bulk update)
router.post('/:id/students', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { student_ids } = req.body; // Array of student IDs
    const batchId = req.params.id;

    if (!Array.isArray(student_ids) || student_ids.length === 0) {
        return res.status(400).json({ message: "student_ids must be a non-empty array" });
    }

    try {
        // Update each student's batch_id
        for (const studentId of student_ids) {
            await db.execute({
                sql: "UPDATE users SET batch_id = ? WHERE id = ? AND role = 'student'",
                args: [batchId, studentId]
            });
        }
        res.json({ message: `${student_ids.length} student(s) assigned to batch successfully` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
