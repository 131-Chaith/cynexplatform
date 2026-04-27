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

async function checkSchemaAndAssign() {
    try {
        console.log("Checking 'users' table info...");
        const tableInfo = await db.execute("PRAGMA table_info(users)");
        const batchIdColumn = tableInfo.rows.find(row => row.name === 'batch_id');

        if (batchIdColumn) {
            console.log("✅ 'batch_id' column exists in 'users' table.");
        } else {
            console.error("❌ 'batch_id' column MISSING in 'users' table!");
            console.table(tableInfo.rows);
            // logic to add column if needed could go here, but let's just observe first
        }

        // Simulate assignment
        const batchId = 1; // Assuming batch ID 1 exists
        const studentIds = [3]; // Assuming student ID 3 exists (admin user often id 1 or 2, student 3)

        console.log(`\nSimulating assignment of student(s) ${studentIds} to batch ${batchId}...`);

        // Check if batch exists first
        const batchCheck = await db.execute({
            sql: "SELECT * FROM batches WHERE id = ?",
            args: [batchId]
        });

        if (batchCheck.rows.length === 0) {
            // Create a dummy batch for testing if none exists
            console.log("Creating dummy batch for testing...");
            await db.execute({
                sql: "INSERT INTO batches (id, batch_name, start_date, end_date) VALUES (?, ?, ?, ?)",
                args: [batchId, 'Test Batch', '2026-01-01', '2026-12-31']
            });
        }

        const sql = "UPDATE users SET batch_id = ? WHERE id = ? AND role = 'student'";
        console.log("Executing SQL:", sql);

        for (const studentId of studentIds) {
            const result = await db.execute({
                sql: sql,
                args: [batchId, studentId]
            });
            console.log(`Update result for student ${studentId}:`, result);
        }

        console.log("✅ Assignment simulation completed.");

    } catch (error) {
        console.error("❌ Error during simulation:", error);
    }
}

checkSchemaAndAssign();
