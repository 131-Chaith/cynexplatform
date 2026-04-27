import { createClient } from "@libsql/client";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const seedSuperAdmin = async () => {
    try {
        console.log("Seeding super_admin...");

        const email = 'super@cynex.ai';
        const password = 'superadmin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if exists
        const res = await db.execute({
            sql: "SELECT * FROM users WHERE email = ?",
            args: [email]
        });

        if (res.rows.length > 0) {
            console.log("Super admin already exists. Updating role/password...");
            await db.execute({
                sql: "UPDATE users SET role = 'super_admin', password = ? WHERE email = ?",
                args: [hashedPassword, email]
            });
        } else {
            console.log("Creating new super_admin...");
            await db.execute({
                sql: "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                args: ["Super Admin", email, hashedPassword, 'super_admin']
            });
        }

        console.log("✅ Super Admin seeded successfully: Login with super@cynex.ai / superadmin123");

    } catch (error) {
        console.error("❌ Seeding failed:", error);
    }
};

seedSuperAdmin();
