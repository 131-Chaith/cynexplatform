import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    try {
        console.log("=== USER 5 DATA ===");
        const user = await db.execute("SELECT * FROM users WHERE id = 5");
        console.log(JSON.stringify(user.rows[0], null, 2));

        console.log("\n=== STUDENTS TABLE SCHEMA ===");
        const schema = await db.execute("SELECT sql FROM sqlite_master WHERE name='students'");
        console.log(schema.rows[0].sql);

        console.log("\n=== STUDENTS TABLE FKs ===");
        const fks = await db.execute("PRAGMA foreign_key_list(students)");
        console.log(JSON.stringify(fks.rows, null, 2));

        console.log("\n=== TEST 1: INSERT WITH USER_ID ONLY ===");
        try {
            await db.execute("INSERT INTO students (user_id) VALUES (5)");
            console.log("SUCCESS");
            await db.execute("DELETE FROM students WHERE user_id = 5");
        } catch (e) {
            console.log("FAILED:", e.message);
            if (e.cause) console.log("CAUSE:", e.cause.message);
        }

        console.log("\n=== TEST 2: INSERT WITH USER_ID AND BATCH_ID=1 (Valid) ===");
        try {
            await db.execute("INSERT INTO students (user_id, batch_id) VALUES (5, 1)");
            console.log("SUCCESS");
            await db.execute("DELETE FROM students WHERE user_id = 5");
        } catch (e) {
            console.log("FAILED:", e.message);
            if (e.cause) console.log("CAUSE:", e.cause.message);
        }

        console.log("\n=== BATCHES TABLE ===");
        const batches = await db.execute("SELECT * FROM batches");
        console.log(JSON.stringify(batches.rows, null, 2));

        console.log("\n=== TRIGGERS ===");
        const triggers = await db.execute("SELECT * FROM sqlite_master WHERE type='trigger' AND tbl_name IN ('students', 'users')");
        console.log(JSON.stringify(triggers.rows, null, 2));

    } catch (e) {
        console.error("FATAL ERROR:", e);
    }
}

run();
