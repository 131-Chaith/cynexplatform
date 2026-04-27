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

const checkEnrollments = async () => {
    try {
        console.log("Checking users...");
        const users = await db.execute("SELECT id, name, email, role FROM users WHERE role = 'student'");
        console.table(users.rows);

        console.log("\nChecking enrollments...");
        const enrollments = await db.execute(`
            SELECT e.student_id, u.name as student_name, e.course_id, c.title as course_title 
            FROM enrollments e
            JOIN users u ON e.student_id = u.id
            JOIN courses c ON e.course_id = c.id
        `);
        console.table(enrollments.rows);

    } catch (error) {
        console.error("Error:", error);
    }
};

checkEnrollments();
