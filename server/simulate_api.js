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
        console.log("Simulating /test-results for Raj (ID 10)");
        const result = await db.execute({
            sql: `SELECT tr.*, u.name as student_name, t.title as test_title, t.questions, 
                         c.title as course_title, m.title as module_title
                  FROM test_results tr
                  JOIN users u ON tr.student_id = u.id
                  JOIN mock_tests t ON tr.test_id = t.id
                  LEFT JOIN modules m ON t.module_id = m.id
                  LEFT JOIN courses c ON (t.course_id = c.id OR m.course_id = c.id)
                  WHERE tr.student_id = 10
                  ORDER BY tr.completed_at DESC`,
            args: []
        });

        console.log(JSON.stringify(result.rows, null, 2));

    } catch (err) {
        console.error(err);
    }
}

run();
