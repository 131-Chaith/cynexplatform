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
        const res = await db.execute(`
            SELECT t.id, t.title as test_title, c.title as course_title, m.title as module_title
            FROM mock_tests t
            LEFT JOIN modules m ON t.module_id = m.id
            LEFT JOIN courses c ON t.course_id = c.id
        `);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    }
}

run();
