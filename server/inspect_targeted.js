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
        const res = await db.execute("PRAGMA table_info(mock_tests)");
        console.log("COLUMNS:", res.rows.map(r => r.name).join(", "));

        const data = await db.execute("SELECT * FROM mock_tests WHERE id = 1");
        console.log("ROW 1:", JSON.stringify(data.rows[0], null, 2));

        const mods = await db.execute("SELECT id, title, course_id FROM modules WHERE id = 1");
        console.log("MOD 1:", JSON.stringify(mods.rows[0], null, 2));

        const course = await db.execute("SELECT id, title FROM courses WHERE id = 1");
        console.log("COURSE 1:", JSON.stringify(course.rows[0], null, 2));

    } catch (err) {
        console.error(err);
    }
}

run();
