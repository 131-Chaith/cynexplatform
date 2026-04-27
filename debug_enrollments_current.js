
import { createClient } from "@libsql/client";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'server/.env') });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function debugEnrollments() {
    try {
        const users = await db.execute("SELECT id, name, email, role, batch_id FROM users");
        const enrollments = await db.execute("SELECT * FROM enrollments");
        const batchCourses = await db.execute("SELECT * FROM batch_courses");
        const courses = await db.execute("SELECT id, title FROM courses");

        const data = {
            users: users.rows,
            enrollments: enrollments.rows,
            batchCourses: batchCourses.rows,
            courses: courses.rows
        };

        fs.writeFileSync('debug_current.json', JSON.stringify(data, null, 2));
        console.log("Written to debug_current.json");
    } catch (error) {
        console.error("Error:", error);
    }
}

debugEnrollments();
