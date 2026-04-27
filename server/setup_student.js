import { db } from './db.js';
import bcrypt from 'bcryptjs';

const setup = async () => {
    try {
        console.log("Setting up student account...");
        
        const hashedPassword = await bcrypt.hash('student123', 10);
        
        // Delete existing if any to be sure
        await db.execute({ sql: "DELETE FROM users WHERE email = ?", args: ['student@gmail.com'] });

        // Ensure student account exists
        await db.execute({
            sql: "INSERT INTO users (name, email, password, role, batch_id) VALUES (?, ?, ?, ?, ?)",
            args: ['Student Demo', 'student@gmail.com', hashedPassword, 'student', 1]
        });

        console.log("Student account 'student@gmail.com' created/verified.");
    } catch (error) {
        console.error("Setup failed:", error);
    }
};

setup();
