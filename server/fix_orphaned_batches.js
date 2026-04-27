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

async function fixOrphanedBatches() {
    try {
        console.log("Starting database cleanup...");

        // 1. Get all valid batch IDs
        const batchesRes = await db.execute("SELECT id FROM batches");
        const validBatchIds = batchesRes.rows.map(r => r.id);
        console.log("Valid Batch IDs:", validBatchIds);

        // 2. Find users with invalid batch_id
        const usersRes = await db.execute("SELECT id, name, batch_id FROM users WHERE batch_id IS NOT NULL");
        const invalidUsers = usersRes.rows.filter(u => !validBatchIds.includes(u.batch_id));

        console.log(`Found ${invalidUsers.length} users with orphaned batch_ids.`);
        for (const user of invalidUsers) {
            console.log(`Cleaning user ${user.name} (ID: ${user.id}, Invalid BatchID: ${user.batch_id})`);
            await db.execute({
                sql: "UPDATE users SET batch_id = NULL WHERE id = ?",
                args: [user.id]
            });
        }

        // 3. Find students with invalid batch_id
        const studentsRes = await db.execute("SELECT user_id, batch_id FROM students WHERE batch_id IS NOT NULL");
        const invalidStudents = studentsRes.rows.filter(s => !validBatchIds.includes(s.batch_id));

        console.log(`Found ${invalidStudents.length} student profiles with orphaned batch_ids.`);
        for (const student of invalidStudents) {
            console.log(`Cleaning student profile for UserID: ${student.user_id} (Invalid BatchID: ${student.batch_id})`);
            await db.execute({
                sql: "UPDATE students SET batch_id = NULL WHERE user_id = ?",
                args: [student.user_id]
            });
        }

        console.log("✅ Database cleanup completed successfully.");

    } catch (error) {
        console.error("❌ Cleanup failed:", error.message);
    }
}

fixOrphanedBatches();
