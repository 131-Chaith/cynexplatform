import { db } from './server/db.js';

async function testConnection() {
    try {
        console.log("Testing DB Connection...");
        const result = await db.execute("SELECT 1");
        console.log("✅ DB Connection Successful!", result);

        console.log("Checking users table...");
        const users = await db.execute("SELECT * FROM users LIMIT 1");
        console.log("✅ Users table exists. Row count:", users.rows.length);
        if (users.rows.length > 0) {
            console.log("Sample user:", users.rows[0]);
        }
    } catch (error) {
        console.error("❌ DB Connection Failed!");
        console.error("Error Message:", error.message);
        console.error("Full Error:", error);
    }
}

testConnection();
