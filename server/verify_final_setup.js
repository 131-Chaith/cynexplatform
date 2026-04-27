import { createClient } from "@libsql/client";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
    const enrollments = await db.execute("SELECT u.email, c.title as enrolled_course FROM enrollments e JOIN users u ON e.student_id = u.id JOIN courses c ON e.course_id = c.id");
    console.log("--- Current Enrollments ---");
    console.table(enrollments.rows);

    const courses = await db.execute("SELECT id, title FROM courses");
    for (const course of courses.rows) {
        console.log(`--- Content for course: ${course.title} ---`);
        const v = await db.execute({ sql: "SELECT count(*) as count FROM videos WHERE course_id = ?", args: [course.id] });
        const a = await db.execute({ sql: "SELECT count(*) as count FROM assignments WHERE course_id = ?", args: [course.id] });
        const t = await db.execute({ sql: "SELECT count(*) as count FROM mock_tests WHERE course_id = ?", args: [course.id] });
        console.log(`  Videos: ${v.rows[0].count}, Assignments: ${a.rows[0].count}, Mock Tests: ${t.rows[0].count}`);
    }
}

main().catch(console.error);
