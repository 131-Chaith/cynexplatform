import { db } from './db.js';
import bcrypt from 'bcryptjs';

async function seed() {
    console.log("--- Seeding Admin User ---");
    const email = 'admin@cynex.ai';
    const password = 'password123';
    const name = 'Cynex Admin';
    const role = 'admin';

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Use INSERT OR REPLACE if your schema supports it, or check first
        const check = await db.execute({
            sql: "SELECT id FROM users WHERE email = ?",
            args: [email]
        });

        if (check.rows.length > 0) {
            console.log("Updating existing admin...");
            await db.execute({
                sql: "UPDATE users SET password = ?, name = ?, role = ? WHERE email = ?",
                args: [hashedPassword, name, role, email]
            });
        } else {
            console.log("Creating new admin...");
            await db.execute({
                sql: "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                args: [name, email, hashedPassword, role]
            });
        }

        console.log("✅ Admin user seeded: " + email + " / " + password);
    } catch (error) {
        console.error("❌ Seeding failed:", error.message);
    } finally {
        process.exit();
    }
}

seed();
