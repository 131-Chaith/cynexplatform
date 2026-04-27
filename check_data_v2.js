import { createClient } from "@libsql/client";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'server/.env') });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
    console.log("--- USERS ---");
    const users = await db.execute("SELECT id, name, email, role, batch_id FROM users");
    console.table(users.rows);

    console.log("--- ENROLLMENTS ---");
    const enrollments = await db.execute("SELECT * FROM enrollments");
    console.table(enrollments.rows);

    console.log("--- COURSES ---");
    const courses = await db.execute("SELECT id, title FROM courses");
    console.table(courses.rows);

    console.log("--- BATCH_COURSES ---");
    const batchCourses = await db.execute("SELECT * FROM batch_courses");
    console.table(batchCourses.rows);
}

main().catch(console.error);
