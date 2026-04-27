
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

async function checkTypes() {
    try {
        const enrollments = await db.execute("SELECT student_id, course_id FROM enrollments WHERE id = 8");
        const row = enrollments.rows[0];
        console.log("Enrollment #8 Info:");
        console.log("student_id type:", typeof row.student_id, "value:", row.student_id);
        console.log("course_id type:", typeof row.course_id, "value:", row.course_id);

        const users = await db.execute("SELECT id FROM users WHERE email = 'student@gmail.com'");
        const user = users.rows[0];
        console.log("\nUser 'Student User' Info:");
        console.log("id type:", typeof user.id, "value:", user.id);

    } catch (error) {
        console.error("Error:", error);
    }
}

checkTypes();
