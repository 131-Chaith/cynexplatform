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
        const c = await db.execute("SELECT id, title FROM courses");
        c.rows.forEach(r => console.log(r));

        console.log("\n=== MODULES ===");
        const m = await db.execute("SELECT id, title, course_id FROM modules");
        m.rows.forEach(r => console.log(r));

        console.log("\n=== MOCK TESTS ===");
        const t = await db.execute("SELECT id, title, course_id, module_id FROM mock_tests");
        t.rows.forEach(r => console.log(r));
    } catch (err) {
        console.error(err);
    }
}

run();
