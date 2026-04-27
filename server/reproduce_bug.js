import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function debug() {
    let output = "";
    const log = (msg) => { output += msg + "\n"; console.log(msg); };

    try {
        log("=== FOREIGN KEYS FOR students ===");
        const fks = await db.execute("PRAGMA foreign_key_list(students)");
        fks.rows.forEach(r => log(`${r.from} references ${r.table}(${r.to})`));

        log("\n=== USERS TABLE CONTENT ===");
        const users = await db.execute("SELECT id, name, role FROM users");
        users.rows.forEach(r => log(`ID: ${r.id}, Name: ${r.name}, Role: ${r.role}`));

        log("\n=== TEST INSERT (user_id=1) ===");
        try {
            await db.execute("INSERT INTO students (user_id) VALUES (1)");
            log("SUCCESS: Inserted user_id=1");
            await db.execute("DELETE FROM students WHERE user_id = 1");
        } catch (e) { log("FAILED user_id=1: " + e.message); }

        log("\n=== TEST INSERT (user_id=5) ===");
        try {
            await db.execute("INSERT INTO students (user_id) VALUES (5)");
            log("SUCCESS: Inserted user_id=5");
            await db.execute("DELETE FROM students WHERE user_id = 5");
        } catch (e) { log("FAILED user_id=5: " + e.message); }

        fs.writeFileSync(path.join(__dirname, "debug.log"), output);
        log("\nFull output written to debug.log");

    } catch (e) {
        log("DEBUG ERROR: " + e.message);
    }
}

debug();
