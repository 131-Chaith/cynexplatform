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

async function fixUser5() {
    try {
        const studentId = 5;
        const batchId = 1;

        console.log(`Assigning Student ${studentId} to Batch ${batchId}...`);

        await db.execute({
            sql: "UPDATE users SET batch_id = ? WHERE id = ?",
            args: [batchId, studentId]
        });

        console.log("Update complete.");

        // Verify
        const user = await db.execute({
            sql: "SELECT * FROM users WHERE id = ?",
            args: [studentId]
        });
        console.log("User:", user.rows[0]);

    } catch (error) {
        console.error("Error:", error);
    }
}

fixUser5();
