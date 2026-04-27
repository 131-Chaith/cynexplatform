import { db } from './db.js';
import bcrypt from 'bcryptjs';

const seedAdmin = async () => {
    const email = 'admin@cynex.ai';
    const password = 'admin123';
    const name = 'Admin User';
    const role = 'admin';

    try {
        // Check if admin exists
        const result = await db.execute({
            sql: "SELECT * FROM users WHERE email = ?",
            args: [email]
        });

        if (result.rows.length > 0) {
            console.log("Admin user already exists. Resetting password and role...");
            const hashedPw = await bcrypt.hash(password, 10);
            await db.execute({
                sql: "UPDATE users SET password = ?, role = ? WHERE email = ?",
                args: [hashedPw, role, email]
            });
            console.log(`Admin password reset to: ${password}`);
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute({
            sql: "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            args: [name, email, hashedPassword, role]
        });

        console.log(`Admin user created successfully.`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

    } catch (error) {
        console.error("Failed to seed admin:", error);
    }
};

seedAdmin();
