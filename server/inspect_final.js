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
        console.log("--- mock_tests table info ---");
        const res1 = await db.execute("PRAGMA table_info(mock_tests)");
        console.log(JSON.stringify(res1.rows, null, 2));

        console.log("\n--- modules table info ---");
        const res2 = await db.execute("PRAGMA table_info(modules)");
        console.log(JSON.stringify(res2.rows, null, 2));

        console.log("\n--- Sample data from mock_tests ---");
        const m = await db.execute("SELECT * FROM mock_tests LIMIT 5");
        console.log(JSON.stringify(m.rows, null, 2));

        console.log("\n--- Sample data from modules ---");
        const mod = await db.execute("SELECT * FROM modules LIMIT 5");
        console.log(JSON.stringify(mod.rows, null, 2));

    } catch (err) {
        console.error("INSPECTION FAILED:", err);
    }
}

run();
