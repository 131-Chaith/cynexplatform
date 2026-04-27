import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function reproduce() {
    try {
        const studentId = 2; // Sai
        const newBatchId = 1; // React Developer

        console.log(`Updating student ${studentId} with batch_id ${newBatchId}...`);

        // Simulate the logic in admin.js PUT route
        // 1. Update users
        await db.execute({
            sql: "UPDATE users SET batch_id = ? WHERE id = ?",
            args: [newBatchId, studentId]
        });

        // 2. Update students
        await db.execute({
            sql: "UPDATE students SET batch_id = ? WHERE user_id = ?",
            args: [newBatchId, studentId]
        });

        // Verify
        const uRes = await db.execute({ sql: "SELECT batch_id FROM users WHERE id = ?", args: [studentId] });
        const sRes = await db.execute({ sql: "SELECT batch_id FROM students WHERE user_id = ?", args: [studentId] });

        console.log('User batch_id:', uRes.rows[0].batch_id);
        console.log('Student batch_id:', sRes.rows[0].batch_id);

        if (uRes.rows[0].batch_id == newBatchId && sRes.rows[0].batch_id == newBatchId) {
            console.log('SUCCESS: Database updated correctly.');
        } else {
            console.log('FAILURE: Database did not update correctly.');
        }

        // Reset to null for next tests
        await db.execute({ sql: "UPDATE users SET batch_id = NULL WHERE id = ?", args: [studentId] });
        await db.execute({ sql: "UPDATE students SET batch_id = NULL WHERE user_id = ?", args: [studentId] });

    } catch (e) {
        console.error("Reproduction failed:", e);
    }
}

reproduce();
