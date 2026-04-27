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

const checkSchema = async () => {
    try {
        console.log("Checking students schema...");
        const res = await db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='students'");
        if (res.rows.length > 0) {
            console.log(res.rows[0].sql);
        } else {
            console.log("Table students not found!");
        }

        console.log("\nChecking batches schema...");
        const res2 = await db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='batches'");
        if (res2.rows.length > 0) {
            console.log(res2.rows[0].sql);
        }
    } catch (error) {
        console.error("Error:", error);
    }
};

checkSchema();
