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

async function addBatchIdColumn() {
    try {
        console.log("Checking if 'batch_id' column exists...");
        const tableInfo = await db.execute("PRAGMA table_info(users)");
        const batchIdColumn = tableInfo.rows.find(row => row.name === 'batch_id');

        if (batchIdColumn) {
            console.log("✅ 'batch_id' column already exists. No changes needed.");
        } else {
            console.log("⚠️ 'batch_id' column missing. Adding it now...");

            // Add column
            await db.execute("ALTER TABLE users ADD COLUMN batch_id INTEGER");
            console.log("✅ Added 'batch_id' column.");

            // Note: SQLite doesn't support adding FK constraints via ALTER TABLE easily without recreation,
            // but for now, just the column is enough for the logic to work.
            // If strict integrity is needed, we'd need a more complex migration (create new table -> copy -> rename).
            // For this fix, we'll proceed with just the column.
        }

    } catch (error) {
        console.error("❌ Error updating schema:", error);
    }
}

addBatchIdColumn();
