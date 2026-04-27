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

async function migrate() {
    try {
        console.log("--- Starting Comprehensive Database Migration ---");

        // 1. Add course_id to modules
        console.log("Checking modules table...");
        const resMod = await db.execute("PRAGMA table_info(modules)");
        const colsMod = resMod.rows.map(r => r.name);
        if (!colsMod.includes('course_id')) {
            console.log("Adding course_id to modules...");
            await db.execute("ALTER TABLE modules ADD COLUMN course_id INTEGER REFERENCES courses(id)");
            console.log("Success.");
        } else {
            console.log("course_id already exists in modules.");
        }

        // 2. Add module_id to mock_tests
        console.log("Checking mock_tests table...");
        const resTest = await db.execute("PRAGMA table_info(mock_tests)");
        const colsTest = resTest.rows.map(r => r.name);
        if (!colsTest.includes('module_id')) {
            console.log("Adding module_id to mock_tests...");
            await db.execute("ALTER TABLE mock_tests ADD COLUMN module_id INTEGER REFERENCES modules(id)");
            console.log("Success.");
        } else {
            console.log("module_id already exists in mock_tests.");
        }

        // 3. Add answers to test_results
        console.log("Checking test_results table...");
        const resRes = await db.execute("PRAGMA table_info(test_results)");
        const colsRes = resRes.rows.map(r => r.name);
        if (!colsRes.includes('answers')) {
            console.log("Adding answers to test_results...");
            await db.execute("ALTER TABLE test_results ADD COLUMN answers JSON");
            console.log("Success.");
        } else {
            console.log("answers already exists in test_results.");
        }

        console.log("--- Migration Finished Successfully ---");
    } catch (err) {
        console.error("MIGRATION FAILED:", err);
        process.exit(1);
    }
}

migrate();
