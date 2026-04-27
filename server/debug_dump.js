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
        console.log("--- All Modules ---");
        const res = await db.execute("SELECT id, title, course_id FROM modules");
        res.rows.forEach(r => console.log(r));

        console.log("\n--- All Courses ---");
        const courses = await db.execute("SELECT id, title FROM courses");
        courses.rows.forEach(r => console.log(r));

        console.log("\n--- Mock Test 2 Raw ---");
        const test = await db.execute("SELECT * FROM mock_tests WHERE id = 2");
        console.log(test.rows[0]);

    } catch (err) {
        console.error(err);
    }
}

run();
