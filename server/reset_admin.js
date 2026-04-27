import { db } from './db.js';
import bcrypt from 'bcryptjs';

async function resetAdmin() {
    try {
        console.log("🔍 Checking for admin user...\n");

        // Check if admin exists
        const result = await db.execute({
            sql: "SELECT * FROM users WHERE email = ?",
            args: ['admin@cynex.ai']
        });

        if (result.rows.length === 0) {
            console.log("❌ Admin user does NOT exist. Creating admin user...\n");

            const hashedPassword = await bcrypt.hash('admin123', 10);

            await db.execute({
                sql: "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                args: ['Admin User', 'admin@cynex.ai', hashedPassword, 'admin']
            });

            console.log("✅ Admin user created successfully!\n");
            console.log("═══════════════════════════════════");
            console.log("📧 Email:    admin@cynex.ai");
            console.log("🔑 Password: admin123");
            console.log("═══════════════════════════════════\n");
        } else {
            console.log("✅ Admin user exists!\n");
            const admin = result.rows[0];
            console.log("Current admin details:");
            console.log("  ID:", admin.id);
            console.log("  Name:", admin.name);
            console.log("  Email:", admin.email);
            console.log("  Role:", admin.role);

            // Reset password to 'admin123'
            console.log("\n🔄 Resetting admin password to 'admin123'...\n");
            const hashedPassword = await bcrypt.hash('admin123', 10);

            await db.execute({
                sql: "UPDATE users SET password = ? WHERE email = ?",
                args: [hashedPassword, 'admin@cynex.ai']
            });

            console.log("✅ Password reset successfully!\n");
            console.log("═══════════════════════════════════");
            console.log("📧 Email:    admin@cynex.ai");
            console.log("🔑 Password: admin123");
            console.log("═══════════════════════════════════\n");
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error("\nFull error:", error);
        process.exit(1);
    }
}

resetAdmin();
