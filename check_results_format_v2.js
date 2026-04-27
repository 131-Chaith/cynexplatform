import { db } from './server/db.js';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

async function check() {
    try {
        const tests = await db.execute("SELECT * FROM mock_tests LIMIT 5");
        console.log("Mock Tests count:", tests.rows.length);
        tests.rows.forEach(t => {
            console.log("Test:", t.title, "Questions JSON type:", typeof t.questions);
            try {
                const qs = JSON.parse(t.questions);
                console.log("  Sample question:", JSON.stringify(qs[0], null, 2));
            } catch (e) {
                console.log("  Failed to parse questions for", t.title);
            }
        });

        const results = await db.execute("SELECT * FROM test_results LIMIT 1");
        if (results.rows.length > 0) {
            console.log("Test Result Sample Answers:", results.rows[0].answers);
        }
    } catch (err) {
        console.error("ERROR:", err);
    }
}
check();
