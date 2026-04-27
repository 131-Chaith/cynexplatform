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

async function check() {
    try {
        const studentId = 2; // Sai
        const user = await db.execute({ sql: "SELECT id, name, batch_id FROM users WHERE id = ?", args: [studentId] });
        console.log("USER:", JSON.stringify(user.rows[0]));

        const enrollments = await db.execute({ sql: "SELECT * FROM enrollments WHERE student_id = ?", args: [studentId] });
        console.log("ENROLLMENTS:", JSON.stringify(enrollments.rows));

        if (user.rows[0] && user.rows[0].batch_id) {
            const batchCourses = await db.execute({ sql: "SELECT * FROM batch_courses WHERE batch_id = ?", args: [user.rows[0].batch_id] });
            console.log("BATCH_COURSES:", JSON.stringify(batchCourses.rows));
        }

        const allCourses = await db.execute("SELECT id, title FROM courses");
        console.log("ALL_COURSES:", JSON.stringify(allCourses.rows));

    } catch (e) {
        console.error(e);
    }
}

check();
