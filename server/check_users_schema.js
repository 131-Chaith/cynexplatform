import 'dotenv/config';
import { db } from './db.js';

async function checkUsersTable() {
    try {
        console.log("Checking users table schema...");
        const usersInfo = await db.execute("PRAGMA table_info(users)");
        console.log("Users table columns:");
        usersInfo.rows.forEach(col => {
            console.log(`  - ${col.name} (${col.type})`);
        });

        console.log("\nChecking if batch_id column exists:");
        const hasBatchId = usersInfo.rows.some(col => col.name === 'batch_id');
        console.log(`  batch_id exists: ${hasBatchId}`);

        if (!hasBatchId) {
            console.log("\n⚠️  WARNING: batch_id column is missing from users table!");
            console.log("Need to add this column to the database.");
        }

        // Check a sample user
        console.log("\nSample user data:");
        const sampleUser = await db.execute("SELECT * FROM users WHERE role = 'student' LIMIT 1");
        console.log(sampleUser.rows[0]);

    } catch (e) {
        console.error("Error:", e);
    }
}

checkUsersTable();
