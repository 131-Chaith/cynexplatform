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

async function checkAccess() {
    try {
        const studentId = 4; // prudhvi's ID from previous debug output

        console.log(`Checking access for student ID: ${studentId}`);

        // 1. Check User details
        const user = await db.execute({
            sql: "SELECT * FROM users WHERE id = ?",
            args: [studentId]
        });
        console.log("User:", user.rows[0]);

        // 2. Check Enrollments
        const enrollments = await db.execute({
            sql: "SELECT * FROM enrollments WHERE student_id = ?",
            args: [studentId]
        });
        console.log("Direct Enrollments:", enrollments.rows);

        // 3. Check Batch assignments
        const batchCourses = await db.execute({
            sql: "SELECT * FROM batch_courses WHERE batch_id = ?",
            args: [user.rows[0]?.batch_id]
        });
        console.log("Batch Courses:", batchCourses.rows);

        // 4. Run the ACTUAL query from the route
        console.log("\nRunning Route Query...");
        const sql = `
            SELECT DISTINCT c.* 
            FROM courses c 
            LEFT JOIN enrollments e ON c.id = e.course_id AND e.student_id = ?
            LEFT JOIN batch_courses bc ON c.id = bc.course_id
            LEFT JOIN users u ON u.batch_id = bc.batch_id AND u.id = ?
            WHERE e.student_id IS NOT NULL OR u.id IS NOT NULL
        `;
        const result = await db.execute({
            sql,
            args: [studentId, studentId]
        });

        console.log("Query Result (Courses):", result.rows);

        if (result.rows.length === 0) {
            console.log("\n❌ Query returned 0 courses. debugging why...");

            // Debugging the OR condition
            const check1 = await db.execute({
                sql: "SELECT * FROM courses c JOIN enrollments e ON c.id = e.course_id WHERE e.student_id = ?",
                args: [studentId]
            });
            console.log("Direct Enrollment Query Result:", check1.rows);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

checkAccess();
