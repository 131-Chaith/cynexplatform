import 'dotenv/config';
import { db } from './server/db.js';
import bcrypt from 'bcryptjs';

async function checkAndResetAdmin() {
    try {
        console.log("Checking for admin user...");

        // Check if admin exists
        const result = await db.execute({
            sql: "SELECT * FROM users WHERE email = ?",
            args: ['admin@cynex.ai']
        });

        if (result.rows.length === 0) {
            console.log("❌ Admin user does NOT exist. Creating admin user...");

            const hashedPassword = await bcrypt.hash('admin123', 10);

            await db.execute({
                sql: "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                args: ['Admin User', 'admin@cynex.ai', hashedPassword, 'admin']
            });

            console.log("✅ Admin user created successfully!");
            console.log("📧 Email: admin@cynex.ai");
            console.log("🔑 Password: admin123");
        } else {
            console.log("✅ Admin user exists!");
            const admin = result.rows[0];
            console.log("Admin details:", {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            });

            // Reset password to 'admin123'
            console.log("\n🔄 Resetting admin password to 'admin123'...");
            const hashedPassword = await bcrypt.hash('admin123', 10);

            await db.execute({
                sql: "UPDATE users SET password = ? WHERE email = ?",
                args: [hashedPassword, 'admin@cynex.ai']
            });

            console.log("✅ Password reset successfully!");
            console.log("📧 Email: admin@cynex.ai");
            console.log("🔑 Password: admin123");
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

checkAndResetAdmin();
