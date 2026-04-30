import { db } from './db.js';
import { createMeetSession } from './services/googleMeetService.js';

async function testService() {
    try {
        console.log("Testing createMeetSession service directly for user 6...");
        
        // Check user 6
        const userRes = await db.execute("SELECT email FROM users WHERE id = 6");
        if (userRes.rows.length === 0) {
            console.log("User 6 not found");
            return;
        }
        console.log("User 6 email:", userRes.rows[0].email);

        const result = await createMeetSession(6, "Test Topic", new Date().toISOString(), 60);
        console.log("Result:", result);
    } catch (err) {
        console.log("Expected Error Caught:", err.message);
    }
}

testService();
