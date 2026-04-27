import 'dotenv/config';
import { db } from './db.js';

async function checkAndFixBatchId() {
    try {
        // Check if batch_id column exists
        const usersInfo = await db.execute("PRAGMA table_info(users)");
        const hasBatchId = usersInfo.rows.some(col => col.name === 'batch_id');

        console.log("=== Users Table Schema ===");
        console.log("Columns:", usersInfo.rows.map(c => c.name).join(', '));
        console.log("\nbatch_id column exists:", hasBatchId);

        if (!hasBatchId) {
            console.log("\n⚠️  batch_id column is MISSING!");
            console.log("Adding batch_id column to users table...");

            await db.execute("ALTER TABLE users ADD COLUMN batch_id INTEGER");
            console.log("✅ batch_id column added successfully!");

            // Verify
            const updatedInfo = await db.execute("PRAGMA table_info(users)");
            console.log("\nUpdated columns:", updatedInfo.rows.map(c => c.name).join(', '));
        } else {
            console.log("✅ batch_id column already exists!");
        }

    } catch (e) {
        console.error("❌ Error:", e.message);
    }
}

checkAndFixBatchId();
