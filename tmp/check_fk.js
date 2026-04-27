import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const db = createClient({ 
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

async function check() {
    try {
        const r = await db.execute("PRAGMA foreign_key_list(submissions)");
        console.log("Submissions FB List:");
        console.log(JSON.stringify(r.rows, null, 2));
    } catch (err) {
        console.error("DB error:", err);
    }
}
check();
