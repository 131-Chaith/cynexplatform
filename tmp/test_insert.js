import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const db = createClient({ 
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

async function run() {
    // Mimic actual parameters
    const studentId = 1; // Sample ID
    const normalizedId = "test_assignment";
    const normalizedScore = 100;
    const dbArgs = [
        normalizedId, 
        studentId, 
        null, // link
        "SELECT * FROM employee;", 
        normalizedScore,
        'interactive',
        'sql'
    ];

    try {
        console.log("Attempting manual insert...");
        const res = await db.execute({
            sql: "INSERT INTO submissions (assignment_id, student_id, submission_link, submission_code, score, type, language) VALUES (?, ?, ?, ?, ?, ?, ?)",
            args: dbArgs
        });
        console.log("Success:", res);
    } catch (err) {
        console.error("FAIL:", err.message);
        if (err.cause) console.error("CAUSE:", err.cause);
    }
}
run();
