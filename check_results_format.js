import { db } from './server/db.js';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

async function check() {
    try {
        const results = await db.execute({
            sql: "SELECT * FROM test_results LIMIT 1",
            args: []
        });
        console.log("TEST RESULT:", JSON.stringify(results.rows[0], null, 2));

        if (results.rows[0]) {
            const test = await db.execute({
                sql: "SELECT * FROM mock_tests WHERE id = ?",
                args: [results.rows[0].test_id]
            });
            console.log("MOCK TEST:", JSON.stringify(test.rows[0], null, 2));
        }
    } catch (err) {
        console.error(err);
    }
}
check();
