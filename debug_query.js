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

async function debugQuery() {
    try {
        const studentId = 4;

        console.log(`Checking JOIN logic for student ID: ${studentId}\n`);

        // 1. Check User Batch
        const user = await db.execute({
            sql: "SELECT id, batch_id FROM users WHERE id = ?",
            args: [studentId]
        });
        console.log("User:", user.rows[0]);
        const batchId = user.rows[0]?.batch_id;
        console.log("User Batch ID type:", typeof batchId, "Value:", batchId);

        // 2. Check Batch Courses
        const bc = await db.execute({
            sql: "SELECT * FROM batch_courses WHERE batch_id = ?",
            args: [batchId] // Use value from user
        });
        console.log("Batch Courses type check:", bc.rows);
        if (bc.rows.length > 0) {
            console.log("Batch ID in BC type:", typeof bc.rows[0].batch_id, "Value:", bc.rows[0].batch_id);
        }

        // 3. Test Join simplified
        console.log("\nTesting JOIN: students -> batch_courses");
        const joinTest = await db.execute({
            sql: `
                SELECT u.id as user_id, u.batch_id as user_batch, bc.course_id 
                FROM users u
                JOIN batch_courses bc ON u.batch_id = bc.batch_id
                WHERE u.id = ?
            `,
            args: [studentId]
        });
        console.log("Join Result:", joinTest.rows);

        // 4. Test Full Query Logic Step-by-Step
        console.log("\nTesting Left Join logic...");
        const fullTest = await db.execute({
            sql: `
                SELECT c.id, c.title, u.id as user_found
                FROM courses c
                LEFT JOIN batch_courses bc ON c.id = bc.course_id
                LEFT JOIN users u ON u.batch_id = bc.batch_id AND u.id = ?
                WHERE bc.course_id IS NOT NULL
            `,
            args: [studentId]
        });
        console.log("Full Logic Result:", fullTest.rows);

    } catch (error) {
        console.error("Error:", error);
    }
}

debugQuery();
