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

async function inspect() {
    try {
        console.log("URL:", process.env.TURSO_DATABASE_URL);

        console.log("\n--- Tables ---");
        const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.table(tables.rows);

        if (tables.rows.some(r => r.name === 'mock_tests')) {
            console.log("\n--- mock_tests columns ---");
            const columns = await db.execute("PRAGMA table_info(mock_tests)");
            console.table(columns.rows);

            console.log("\n--- Sample mock_tests ---");
            const data = await db.execute("SELECT * FROM mock_tests LIMIT 5");
            console.table(data.rows);
        }

        if (tables.rows.some(r => r.name === 'test_results')) {
            console.log("\n--- test_results sample ---");
            const results = await db.execute("SELECT * FROM test_results ORDER BY id DESC LIMIT 5");
            console.table(results.rows);
        }

        if (tables.rows.some(r => r.name === 'courses')) {
            console.log("\n--- courses sample ---");
            const courses = await db.execute("SELECT * FROM courses LIMIT 5");
            console.table(courses.rows);
        }

        if (tables.rows.some(r => r.name === 'modules')) {
            console.log("\n--- modules sample ---");
            const modules = await db.execute("SELECT * FROM modules LIMIT 5");
            console.table(modules.rows);
        }

    } catch (err) {
        console.error("INSPECTION FAILED:", err);
    }
}

inspect();
