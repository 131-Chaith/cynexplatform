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
        console.log("DB URL:", process.env.TURSO_DATABASE_URL);

        const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log("Tables:", tables.rows.map(r => r.name).join(", "));

        console.log("\n--- Users ---");
        const users = await db.execute("SELECT id, name, email, role FROM users");
        users.rows.forEach(r => console.log(r));

        console.log("\n--- Test Results ---");
        const results = await db.execute("SELECT tr.id, tr.student_id, tr.test_id, tr.score FROM test_results tr");
        results.rows.forEach(r => console.log(r));

        console.log("\n--- Mock Tests ---");
        const tests = await db.execute("SELECT id, title, course_id, module_id FROM mock_tests");
        tests.rows.forEach(r => console.log(r));

        console.log("\n--- Courses ---");
        const courses = await db.execute("SELECT id, title FROM courses");
        courses.rows.forEach(r => console.log(r));

        console.log("\n--- Modules ---");
        const modules = await db.execute("SELECT id, title, course_id FROM modules");
        modules.rows.forEach(r => console.log(r));

    } catch (err) {
        console.error(err);
    }
}

run();
