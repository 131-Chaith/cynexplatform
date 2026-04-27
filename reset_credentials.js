
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'server/.env') });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function resetAdmin() {
    try {
        const email = 'admin@gmail.com';
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        console.log(`Resetting admin password for ${email} to: ${password}`);

        const check = await db.execute({
            sql: "SELECT id FROM users WHERE email = ?",
            args: [email]
        });

        if (check.rows.length > 0) {
            // Update existing
            await db.execute({
                sql: "UPDATE users SET password = ?, role = 'admin' WHERE email = ?",
                args: [hashedPassword, email]
            });
            console.log("Admin password updated successfully.");
        } else {
            // Create new
            await db.execute({
                sql: "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                args: ["Admin User", email, hashedPassword, "admin"]
            });
            console.log("Admin user created successfully.");
        }

        // Also check if Student User needs reset since they were reporting issues earlier
        const sEmail = 'student@gmail.com';
        const sPwd = 'student123';
        const sHash = await bcrypt.hash(sPwd, 10);
        await db.execute({
            sql: "UPDATE users SET password = ? WHERE email = ?",
            args: [sHash, sEmail]
        });
        console.log(`Student password for ${sEmail} also reset to: ${sPwd}`);

    } catch (error) {
        console.error("Failed to reset admin:", error);
    }
}

resetAdmin();
