import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    try {
        console.log("Checking mock_tests columns...");
        const res1 = await db.execute("PRAGMA table_info(mock_tests)");
        const cols1 = res1.rows.map(r => r.name);
        console.log("Current mock_tests columns:", cols1.join(", "));

        if (!cols1.includes('module_id')) {
            console.log("Adding module_id to mock_tests...");
            await db.execute("ALTER TABLE mock_tests ADD COLUMN module_id INTEGER");
            console.log("Added module_id.");
        }

        console.log("Checking test_results columns...");
        const res2 = await db.execute("PRAGMA table_info(test_results)");
        const cols2 = res2.rows.map(r => r.name);
        console.log("Current test_results columns:", cols2.join(", "));

        if (!cols2.includes('answers')) {
            console.log("Adding answers to test_results...");
            await db.execute("ALTER TABLE test_results ADD COLUMN answers JSON");
            console.log("Added answers.");
        }

        console.log("Fixing data mapping if possible...");
        // If SQL test (ID 1) has module_id NULL, set it to 1.
        await db.execute("UPDATE mock_tests SET module_id = 1 WHERE title = 'SQL' AND module_id IS NULL");

        console.log("MIGRATION COMPLETE.");
    } catch (err) {
        console.error("MIGRATION FAILED:", err);
    }
}

run();
