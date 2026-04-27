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
        console.log("=== COURSES ===");
        const c = await db.execute("SELECT * FROM courses");
        console.table(c.rows);

        console.log("\n=== MODULES ===");
        const m = await db.execute("SELECT id, title, course_id FROM modules");
        console.table(m.rows);

        console.log("\n=== MOCK TEST 2 ===");
        const t = await db.execute("SELECT * FROM mock_tests WHERE id = 2");
        console.log(t.rows[0]);

    } catch (err) {
        console.error(err);
    }
}

run();
