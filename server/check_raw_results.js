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
        const res = await db.execute("SELECT * FROM test_results");
        console.log("Count:", res.rows.length);
        if (res.rows.length > 0) {
            console.log("First row:", JSON.stringify(res.rows[0], null, 2));
        }

        const tests = await db.execute("SELECT id, title FROM mock_tests");
        console.log("Mock Tests:", tests.rows);

    } catch (err) {
        console.error(err);
    }
}

run();
