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

async function debugUser() {
    try {
        console.log("--- Debugging User 'prudhvi' ---");

        // 1. Find User
        const result = await db.execute("SELECT * FROM users WHERE name LIKE '%prudhvi%' OR email LIKE '%prudhvi%'");
        if (result.rows.length === 0) {
            console.log("❌ User 'prudhvi' not found.");
            return;
        }

        const user = result.rows[0];
        console.log("User Found:", user);
        const userId = user.id;
        const batchId = user.batch_id;

        // 2. Check Enrollments
        const enrollments = await db.execute({
            sql: "SELECT * FROM enrollments WHERE student_id = ?",
            args: [userId]
        });
        console.log(`\nDirect Enrollments for user ${userId}:`, enrollments.rows);

        // 3. Check Batch Courses
        if (batchId) {
            console.log(`\nChecking Batch ID: ${batchId}`);
            const batchCourses = await db.execute({
                sql: "SELECT * FROM batch_courses WHERE batch_id = ?",
                args: [batchId]
            });
            console.log(`Batch Courses for batch ${batchId}:`, batchCourses.rows);
        } else {
            console.log("\nUser has no batch_id assigned.");
        }

        // 4. Check All Courses
        const courses = await db.execute("SELECT id, title FROM courses");
        console.log("\nAvailable Courses:", courses.rows);

    } catch (error) {
        console.error("Error:", error);
    }
}

debugUser();
