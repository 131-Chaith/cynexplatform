import { db } from './server/db.js';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

async function debugResults() {
    try {
        const results = await db.execute("SELECT * FROM test_results ORDER BY completed_at DESC LIMIT 3");
        console.log("TEST RESULTS TABLE DUMP:");
        results.rows.forEach(r => {
            console.log(`ID: ${r.id}, TestID: ${r.test_id}, Score: ${r.score}/${r.total_questions}`);
            console.log(`Answers Raw: ${r.answers}`);
            console.log(`Answers Parsed Type: ${typeof r.answers}`);
            try {
                const parsed = JSON.parse(r.answers);
                console.log(`Parsed Keys: ${Object.keys(parsed)}`);
                console.log(`Parsed Value: ${JSON.stringify(parsed)}`);
            } catch (e) {
                console.log("Failed to parse answers string");
            }
            console.log("-------------------");
        });
    } catch (err) {
        console.error(err);
    }
}
debugResults();
