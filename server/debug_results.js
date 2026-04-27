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
        console.log("--- All Test Results ---");
        const res = await db.execute(`
            SELECT tr.id, u.name as student_name, tr.student_id, t.title as test_title, 
                   tr.score, tr.total_questions, tr.answers, t.questions,
                   t.course_id, t.module_id
            FROM test_results tr
            JOIN users u ON tr.student_id = u.id
            JOIN mock_tests t ON tr.test_id = t.id
            ORDER BY tr.id DESC LIMIT 10
        `);
        console.table(res.rows.map(r => ({
            id: r.id,
            student: r.student_name,
            s_id: r.student_id,
            test: r.test_title,
            score: `${r.score}/${r.total_questions}`,
            has_ans: !!r.answers,
            has_ques: !!r.questions,
            c_id: r.course_id,
            m_id: r.module_id
        })));
    } catch (err) {
        console.error(err);
    }
}

run();
