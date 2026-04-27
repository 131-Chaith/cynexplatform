import { db } from './db.js';

const verify = async () => {
    try {
        console.log("Verifying test_results schema...");
        const result = await db.execute("PRAGMA table_info(test_results)");
        const columns = result.rows.map(r => r.name);
        if (columns.includes('answers')) {
            console.log("SUCCESS: 'answers' column found in test_results.");
        } else {
            console.error("FAILURE: 'answers' column NOT found in test_results.");
            process.exit(1);
        }

        console.log("Checking for mock test data...");
        const testRes = await db.execute("SELECT id, questions FROM mock_tests LIMIT 1");
        if (testRes.rows.length === 0) {
            console.log("No mock tests found. Please create one in the UI.");
        } else {
            console.log("Mock test found. ID:", testRes.rows[0].id);
        }

    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
};

verify();
