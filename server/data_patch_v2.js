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
        console.log("--- Executing Final Data Patch ---");

        // 1. Find the correct IDs
        const courseRes = await db.execute("SELECT id FROM courses WHERE title LIKE '%Data Science%' LIMIT 1");
        const courseId = courseRes.rows[0]?.id;

        const moduleRes = await db.execute("SELECT id FROM modules WHERE title = 'SQL' LIMIT 1");
        const moduleId = moduleRes.rows[0]?.id;

        console.log(`Mapping found: Course ID ${courseId}, Module ID ${moduleId}`);

        if (courseId && moduleId) {
            // Update Module to point to Course
            console.log(`Updating Module ${moduleId} -> Course ${courseId}`);
            await db.execute({
                sql: "UPDATE modules SET course_id = ? WHERE id = ?",
                args: [courseId, moduleId]
            });

            // Update Mock Test to point to Course and Module
            console.log(`Updating Mock Test 2 -> Course ${courseId}, Module ${moduleId}`);
            await db.execute({
                sql: "UPDATE mock_tests SET course_id = ?, module_id = ? WHERE id = 2",
                args: [courseId, moduleId]
            });

            // 2. Populate dummy answers for Student ID 10 (Raj)
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

            console.log("--- Data Patch Success ---");
        } else {
            console.error("Could not find appropriate Course or Module to map.");
        }

    } catch (err) {
        console.error("PATCH FAILED:", err);
    }
}

run();
