import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    try {
        const aPwd = await bcrypt.hash('admin123', 10);
        const sPwd = await bcrypt.hash('student123', 10);
        
        // Admin
        await db.execute({
            sql: "DELETE FROM users WHERE email = 'admin@cynex.ai'"
        });
        await db.execute({
            sql: "INSERT INTO users (name, email, password, role) VALUES ('Admin User', 'admin@cynex.ai', ?, 'admin')",
            args: [aPwd]
        });

        // Student
        await db.execute({
            sql: "DELETE FROM users WHERE email = 'student@cynex.ai'"
        });
        await db.execute({
            sql: "INSERT INTO users (name, email, password, role) VALUES ('Student User', 'student@cynex.ai', ?, 'student')",
            args: [sPwd]
        });

        console.log('✅ Credentials updated: admin@cynex.ai / student@cynex.ai');
    } catch (err) {
        console.error(err);
    }
}
run();
