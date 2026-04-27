
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

async function simulateStudentRequest(studentId) {
    try {
        console.log(`Simulating request for Student ID: ${studentId}`);
        
        // 1. Check for direct enrollments
        const enrollRows = await db.execute({
            sql: "SELECT course_id FROM enrollments WHERE student_id = ?",
            args: [studentId]
        });
        console.log("Direct Enrollments found:", enrollRows.rows.length);
        console.log(JSON.stringify(enrollRows.rows, null, 2));

        if (enrollRows.rows.length > 0) {
            const directIds = enrollRows.rows.map(r => r.course_id);
            const placeholders = directIds.map(() => '?').join(',');
            const sql = `SELECT * FROM courses WHERE id IN (${placeholders})`;
            const result = await db.execute({ sql, args: directIds });
            console.log("RESULT (Direct):", result.rows.length, "courses");
            console.log(JSON.stringify(result.rows, null, 2));
        } else {
            console.log("No direct enrollments, checking batch...");
            const userRes = await db.execute({
                sql: "SELECT batch_id FROM users WHERE id = ?",
                args: [studentId]
            });
            const batchId = userRes.rows[0]?.batch_id;
            console.log("Batch ID:", batchId);

            if (batchId) {
                const sql = `SELECT * FROM courses WHERE id IN (SELECT course_id FROM batch_courses WHERE batch_id = ?)`;
                const result = await db.execute({ sql, args: [batchId] });
                console.log("RESULT (Batch):", result.rows.length, "courses");
                console.log(JSON.stringify(result.rows, null, 2));
            } else {
                console.log("No batch found.");
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

// "Student User" ID is 1001
simulateStudentRequest(1001);
