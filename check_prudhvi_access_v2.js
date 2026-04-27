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
        const studentId = 4;

        console.log(`Checking access for student ID: ${studentId}`);

        // 1. Get user's batch_id
        const userRes = await db.execute({
            sql: "SELECT batch_id FROM users WHERE id = ?",
            args: [studentId]
        });
        const batchId = userRes.rows[0]?.batch_id;
        console.log("Batch ID:", batchId);

        // 2. Fetch courses (Direct Enrollment OR Batch Enrollment)
        let sql = `SELECT * FROM courses WHERE id IN (SELECT course_id FROM enrollments WHERE student_id = ?)`;
        let args = [studentId];

        if (batchId) {
            console.log("User has batch, appending batch logic...");

            // DEBUG: Check batch_courses content
            const bc = await db.execute("SELECT * FROM batch_courses");
            console.log("ALL Batch Courses:", bc.rows);

            // DEBUG: Check course 3 exists
            const c3 = await db.execute("SELECT * FROM courses WHERE id = 3");
            console.log("Course 3:", c3.rows);

            sql += ` OR id IN (SELECT course_id FROM batch_courses WHERE batch_id = ?)`;
            args.push(batchId);
            // Corrected: Only push once.
        }

        console.log("Executing SQL:", sql);
        console.log("Args:", args);

        const result = await db.execute({ sql, args });

        console.log("Query Result (Courses):", result.rows);

        if (result.rows.length === 0) {
            console.log("❌ New logic also returned 0 courses. Something is really wrong.");
        } else {
            console.log("✅ Success! Found courses:", result.rows.length);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

checkAccess();
