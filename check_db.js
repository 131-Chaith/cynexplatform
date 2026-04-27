import 'dotenv/config';
import { db } from './server/db.js';

async function checkDb() {
    try {
        console.log("Checking tables...");
        const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log("Tables:", tables.rows);

        console.log("Checking modules table info...");
        const modulesInfo = await db.execute("PRAGMA table_info(modules)");
        console.log("Modules Columns:", modulesInfo.rows);
    } catch (e) {
        console.error("Error:", e);
    }
}

checkDb();
