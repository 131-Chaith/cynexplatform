import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function checkDb() {
    try {
        console.log("Checking DB with URL:", process.env.TURSO_DATABASE_URL);

        const users = await db.execute("SELECT id, name, batch_id FROM users WHERE role = 'student'");
        const batches = await db.execute("SELECT id, batch_name FROM batches");
        const courses = await db.execute("SELECT id, title FROM courses");

        console.log("=== Users (Students) ===");
        users.rows.forEach(r => console.log(`ID: ${r.id}, Name: ${r.name}, BatchID: ${r.batch_id}`));

        console.log("\n=== Batches ===");
        batches.rows.forEach(r => console.log(`ID: ${r.id}, Name: ${r.batch_name}`));

        console.log("\n=== Courses ===");
        courses.rows.forEach(r => console.log(`ID: ${r.id}, Title: ${r.title}`));

        try {
            const students = await db.execute("SELECT user_id, batch_id FROM students");
            console.log("\n=== Students Profile ===");
            students.rows.forEach(r => console.log(`UserID: ${r.user_id}, BatchID: ${r.batch_id}`));
        } catch (e) {
            console.log("\n=== Students Table Error (maybe it doesn't exist yet?) ===");
            console.log(e.message);
        }

    } catch (e) {
        console.error("DEBUG ERROR:", e);
    } finally {
        // No close method in libsql client needed usually but good to know
    }
}

checkDb();
