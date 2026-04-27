import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: "server/.env" });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    let log = "";
    const logLine = (m) => { log += m + "\n"; console.log(m); };

    try {
        logLine("=== SCHEMA DUMP ===");
        const master = await db.execute("SELECT name, type, sql FROM sqlite_master");
        master.rows.forEach(r => {
            logLine(`\n${r.type.toUpperCase()}: ${r.name}`);
            logLine(r.sql);
        });

        logLine("\n=== DATA CHECK ===");
        const user5 = await db.execute("SELECT * FROM users WHERE id = 5");
        logLine("User 5 record: " + JSON.stringify(user5.rows[0]));

        const batches = await db.execute("SELECT * FROM batches");
        logLine("All Batches: " + JSON.stringify(batches.rows));

        const studentProfile = await db.execute("SELECT * FROM students WHERE user_id = 5");
        logLine("Student 5 profile: " + JSON.stringify(studentProfile.rows[0]));

        fs.writeFileSync("c:/SP/full_debug.log", log);
        console.log("Written to c:/SP/full_debug.log");
    } catch (e) {
        console.error(e);
    }
}

run();
