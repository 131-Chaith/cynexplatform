import { createClient } from "@libsql/client";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'server/.env') });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function checkUser5() {
    try {
        const studentId = 5;
        console.log(`Checking User ID: ${studentId}`);

        const user = await db.execute({
            sql: "SELECT * FROM users WHERE id = ?",
            args: [studentId]
        });
        console.log("User:", user.rows[0]);

        const enrollments = await db.execute({
            sql: "SELECT * FROM enrollments WHERE student_id = ?",
            args: [studentId]
        });
        console.log("Enrollments:", enrollments.rows);

    } catch (error) {
        console.error("Error:", error);
    }
}

checkUser5();
