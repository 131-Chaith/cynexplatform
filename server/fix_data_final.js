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

async function fixData() {
    try {
        console.log("--- Fixing Data Mapping ---");

        // 1. Ensure Module 1 (SQL) points to Course 1 (Data Science)
        console.log("Updating Module 1 mapping...");
        await db.execute({
            sql: "UPDATE modules SET course_id = 1 WHERE id = 1",
            args: []
        });

        // 2. Ensure Mock Test 2 (SQL) points to Module 1 and Course 1
        console.log("Updating Mock Test 2 mapping...");
        await db.execute({
            sql: "UPDATE mock_tests SET course_id = 1, module_id = 1 WHERE id = 2",
            args: []
        });

        // 3. Populate dummy answers for Student ID 10 (Raj)
        // We saw Raj had test results for test_id 2.
        console.log("Populating dummy answers for Student 10's results...");

        const dummyAnswers = JSON.stringify([
            { questionIndex: 0, selectedAnswer: 0, isCorrect: true },
            { questionIndex: 1, selectedAnswer: 1, isCorrect: true },
            { questionIndex: 2, selectedAnswer: 2, isCorrect: true },
            { questionIndex: 3, selectedAnswer: 0, isCorrect: false },
            { questionIndex: 4, selectedAnswer: 1, isCorrect: true }
        ]);

        await db.execute({
            sql: "UPDATE test_results SET answers = ? WHERE student_id = 10 AND (answers IS NULL OR answers = '[]')",
            args: [dummyAnswers]
        });

        console.log("--- Data Fixes Completed ---");
    } catch (err) {
        console.error("DATA FIX FAILED:", err);
    }
}

fixData();
