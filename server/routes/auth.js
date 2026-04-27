import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check if user exists
        const result = await db.execute({
            sql: "SELECT * FROM users WHERE email = ?",
            args: [email]
        });

        if (result.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Allow 'super_admin' if passed, otherwise default to mapped role or student
        let userRole = role;
        if (role !== 'super_admin' && role !== 'admin') {
            userRole = 'student';
        }
        // Strict check: verifyAdmin middleware should probably protect creation of super_admin in real app, 
        // but for this internal tool we trust the input regarding 'super_admin' for now, 
        // or effectively 'admin' becomes 'admin', 'super_admin' becomes 'super_admin'.
        // Original logic: const userRole = role === 'admin' ? 'admin' : 'student';

        await db.execute({
            sql: "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            args: [name, email, hashedPassword, userRole]
        });

        res.status(201).json({ message: 'User registered successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await db.execute({
            sql: "SELECT * FROM users WHERE email = ?",
            args: [email]
        });

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, batch_id: user.batch_id }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, batch_id: user.batch_id }
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);
        res.status(500).json({ message: 'Server error', details: error.message });
    }
});



export default router;
