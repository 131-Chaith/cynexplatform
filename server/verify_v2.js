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
        const result = await db.execute({
            sql: `SELECT tr.id, t.title as test_title, c.title as course_title, m.title as module_title
                  FROM test_results tr
                  JOIN mock_tests t ON tr.test_id = t.id
                  LEFT JOIN modules m ON t.module_id = m.id
                  LEFT JOIN courses c ON t.course_id = c.id
                  ORDER BY tr.completed_at DESC LIMIT 5`,
            args: []
        });
        console.table(result.rows);
    } catch (err) {
        console.error(err);
    }
}

run();
