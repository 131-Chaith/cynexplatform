import { db } from './db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function inspect() {
    try {
        console.log("--- mock_tests table info ---");
        const mockTestsInfo = await db.execute("PRAGMA table_info(mock_tests)");
        console.table(mockTestsInfo.rows);

        console.log("\n--- test_results table info ---");
        const testResultsInfo = await db.execute("PRAGMA table_info(test_results)");
        console.table(testResultsInfo.rows);

        console.log("\n--- Sample mock_tests ---");
        const mockTests = await db.execute("SELECT id, course_id, module_id, title FROM mock_tests LIMIT 5");
        console.table(mockTests.rows);

        console.log("\n--- Sample courses ---");
        const courses = await db.execute("SELECT id, title FROM courses LIMIT 5");
        console.table(courses.rows);

        console.log("\n--- Sample modules ---");
        const modules = await db.execute("SELECT id, course_id, title FROM modules LIMIT 5");
        console.table(modules.rows);

        console.log("\n--- Sample test_results ---");
        const results = await db.execute("SELECT tr.id, tr.test_id, tr.score, tr.answers FROM test_results tr LIMIT 5");
        console.table(results.rows);

    } catch (err) {
        console.error(err);
    }
}

inspect();
