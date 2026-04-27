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
        console.log("--- Raj (ID 5) Data Patch ---");

        const dummyAnswers = JSON.stringify([
            { questionIndex: 0, selectedAnswer: 0, isCorrect: true },
            { questionIndex: 1, selectedAnswer: 1, isCorrect: true },
            { questionIndex: 2, selectedAnswer: 2, isCorrect: true },
            { questionIndex: 3, selectedAnswer: 0, isCorrect: false },
            { questionIndex: 4, selectedAnswer: 1, isCorrect: true }
        ]);

        const res = await db.execute({
            sql: "UPDATE test_results SET answers = ? WHERE student_id = 5",
            args: [dummyAnswers]
        });
        console.log("Updated rows:", res.rowsAffected);

        console.log("--- Patch Success ---");
    } catch (err) {
        console.error(err);
    }
}

run();
