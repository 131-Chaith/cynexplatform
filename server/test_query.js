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
            sql: `SELECT tr.*, u.name as student_name, t.title as test_title, 
                         c.title as course_title, m.title as module_title
                  FROM test_results tr
                  JOIN users u ON tr.student_id = u.id
                  JOIN mock_tests t ON tr.test_id = t.id
                  LEFT JOIN modules m ON t.module_id = m.id
                  LEFT JOIN courses c ON (t.course_id = c.id OR m.course_id = c.id)
                  WHERE tr.student_id = 2
                  ORDER BY tr.completed_at DESC`,
            args: []
        });
        console.table(result.rows.map(r => ({
            test_title: r.test_title,
            course_title: r.course_title,
            module_title: r.module_title
        })));
    } catch (err) {
        console.error(err);
    }
}

run();
