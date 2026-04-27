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
        console.log("--- Fixing Data ---");

        // 1. Fix Mock Test 2 (SQL) mapping
        // We know course 1 is Data Science and module 1 is SQL
        console.log("Fixing Mock Test 2...");
        await db.execute({
            sql: "UPDATE mock_tests SET course_id = 1, module_id = 1 WHERE id = 2",
            args: []
        });

        // 2. Populate dummy answers for Raj (Student ID 10)
        // Raj's results are 16, 17, 18
        console.log("Populating dummy answers for Student 10's results...");
        const dummyAnswers = JSON.stringify({
            "0": 0, "1": 1, "2": 2, "3": 0, "4": 1,
            "5": 2, "6": 0, "7": 1, "8": 2, "9": 0
        });

        await db.execute({
            sql: "UPDATE test_results SET answers = ? WHERE student_id = 10 AND answers IS NULL",
            args: [dummyAnswers]
        });

        console.log("FIXES COMPLETED.");

    } catch (err) {
        console.error(err);
    }
}

run();
