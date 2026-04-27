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

async function assignCourse() {
    try {
        const batchId = 1; // Assuming 'prudhvi' is in batch 1
        const courseId = 3; // 'Data Science with AI'

        console.log(`Assigning Course ${courseId} to Batch ${batchId}...`);

        await db.execute({
            sql: "INSERT INTO batch_courses (batch_id, course_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
            args: [batchId, courseId]
        });

        console.log("Assignment complete.");

        // Verify
        const result = await db.execute({
            sql: "SELECT * FROM batch_courses WHERE batch_id = ?",
            args: [batchId]
        });
        console.log("Current Batch Courses:", result.rows);

    } catch (error) {
        console.error("Error:", error);
    }
}

assignCourse();
