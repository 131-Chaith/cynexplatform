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
        console.log("MOCK TESTS:");
        const t = await db.execute("SELECT id, course_id, module_id, title FROM mock_tests");
        console.table(t.rows);

        console.log("MODULES:");
        const m = await db.execute("SELECT id, course_id, title FROM modules");
        console.table(m.rows);

        console.log("COURSES:");
        const c = await db.execute("SELECT id, title FROM courses");
        console.table(c.rows);
    } catch (err) {
        console.error(err);
    }
}

run();
