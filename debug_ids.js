import { createClient } from "@libsql/client";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'server/.env') });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const debugIds = async () => {
    try {
        console.log("--- COURSES ---");
        const courses = await db.execute("SELECT id, title FROM courses");
        console.table(courses.rows);

        console.log("\n--- USERS (Venky) ---");
        const users = await db.execute("SELECT id, name FROM users WHERE name LIKE '%Venky%'");
        console.table(users.rows);

        if (users.rows.length > 0) {
            const userId = users.rows[0].id;
            console.log(`\n--- STUDENTS (user_id = ${userId}) ---`);
            const students = await db.execute({
                sql: "SELECT id, user_id FROM students WHERE user_id = ?",
                args: [userId]
            });
            console.table(students.rows);
        }

        console.log("\n--- ENROLLMENTS SCHEMA AGAIN ---");
        const schema = await db.execute("SELECT sql FROM sqlite_master WHERE name='enrollments'");
        console.log(schema.rows[0]?.sql);

    } catch (error) {
        console.error("Error:", error);
    }
};

debugIds();
