import { db } from "./db.js";
import bcrypt from "bcryptjs";

async function resetAdmin() {
    try {
        const email = 'admin@gmail.com';
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        console.log(`Resetting admin password for ${email} to: ${password}`);

        const result = await db.execute({
            sql: "UPDATE users SET password = ?, role = 'admin' WHERE email = ?",
            args: [hashedPassword, email]
        });

        if (result.rowsAffected === 0) {
            // INSERT if doesn't exist
            await db.execute({
                sql: "INSERT INTO users (name, email, password, role) VALUES ('Admin User', ?, ?, 'admin')",
                args: [email, hashedPassword]
            });
            console.log("Admin user created.");
        } else {
            console.log("Admin password updated.");
        }

        // Fix student@gmail.com as well
        const sPwd = await bcrypt.hash('student123', 10);
        await db.execute({
            sql: "UPDATE users SET password = ? WHERE email = 'student@gmail.com'",
            args: [sPwd]
        });
        console.log("Student login fixed (email: student@gmail.com, password: student123)");

    } catch (error) {
        console.error("Failed to reset credentials:", error);
    }
}

resetAdmin();
