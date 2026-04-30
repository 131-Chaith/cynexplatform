import { db } from './db.js';

async function test() {
    try {
        const result = await db.execute("SELECT 1");
        console.log("Connection successful:", result.rows);
    } catch (error) {
        console.error("Connection failed:", error);
    }
}

test();
