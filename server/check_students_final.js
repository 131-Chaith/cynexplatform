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
    const students = await db.execute(`
        SELECT u.id, u.email, u.name, c.title as enrolled_course 
        FROM users u 
        LEFT JOIN enrollments e ON u.id = e.student_id 
        LEFT JOIN courses c ON e.course_id = c.id 
        WHERE u.role = 'student'
    `);
    console.table(students.rows);
}

main().catch(console.error);
