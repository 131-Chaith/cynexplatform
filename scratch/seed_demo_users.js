import { createClient } from "@libsql/client";
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = createClient({
    url: `file:${path.join(__dirname, 'server/local.db')}`
});

const seed = async () => {
    const password = await bcrypt.hash('admin123', 10);
    const studentPassword = await bcrypt.hash('student123', 10);

    try {
        await db.execute({
            sql: "INSERT OR REPLACE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            args: ["Admin User", "admin@cynex.ai", password, "admin"]
        });
        await db.execute({
            sql: "INSERT OR REPLACE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            args: ["Student User", "student@cynex.ai", studentPassword, "student"]
        });
        console.log("Seeded demo users successfully!");
    } catch (e) {
        console.error("Seeding failed:", e);
    }
};

seed();
