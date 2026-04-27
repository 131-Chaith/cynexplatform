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
        console.log("--- Courses ---");
        const courses = await db.execute("SELECT id, title FROM courses");
        console.table(courses.rows);

        console.log("\n--- Modules ---");
        const modules = await db.execute("SELECT id, title, course_id FROM modules");
        console.table(modules.rows);

    } catch (err) {
        console.error(err);
    }
}

run();
