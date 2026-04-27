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

async function debugEnrollments() {
    try {
        console.log("--- Debugging Enrollments ---");

        // 1. List all students
        console.log("\n1. All Students:");
        const students = await db.execute("SELECT id, name, email, role, batch_id FROM users WHERE role = 'student'");
        console.table(students.rows);

        // 2. List all batches
        console.log("\n2. All Batches:");
        const batches = await db.execute("SELECT * FROM batches");
        console.table(batches.rows);

        // 3. List batch-course links
        console.log("\n3. Batch-Course Links (batch_courses):");
        const batchCourses = await db.execute("SELECT * FROM batch_courses");
        console.table(batchCourses.rows);

        // 4. List direct enrollments
        console.log("\n4. Direct Enrollments (enrollments):");
        const enrollments = await db.execute("SELECT * FROM enrollments");
        console.table(enrollments.rows);

        // 5. List courses
        console.log("\n5. Courses:");
        const courses = await db.execute("SELECT id, title FROM courses");
        console.table(courses.rows);

    } catch (error) {
        console.error("Debug script failed:", error);
    }
}

debugEnrollments();
