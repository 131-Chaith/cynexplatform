import { createClient } from "@libsql/client";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'server/.env') });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const debugIds = async () => {
    try {
        let output = "";

        output += "--- COURSES ---\n";
        const courses = await db.execute("SELECT id, title FROM courses");
        output += JSON.stringify(courses.rows, null, 2) + "\n\n";

        output += "--- USERS (Venky) ---\n";
        const users = await db.execute("SELECT id, name FROM users WHERE name LIKE '%Venky%'");
        output += JSON.stringify(users.rows, null, 2) + "\n\n";

        if (users.rows.length > 0) {
            const userId = users.rows[0].id;
            output += `--- STUDENTS (user_id = ${userId}) ---\n`;
            const students = await db.execute({
                sql: "SELECT id, user_id FROM students WHERE user_id = ?",
                args: [userId]
            });
            output += JSON.stringify(students.rows, null, 2) + "\n\n";
        }

        output += "--- ENROLLMENTS SCHEMA ---\n";
        const schema = await db.execute("SELECT sql FROM sqlite_master WHERE name='enrollments'");
        output += schema.rows[0]?.sql + "\n";

        fs.writeFileSync('debug_output.txt', output);
        console.log("Output written to debug_output.txt");

    } catch (error) {
        console.error("Error:", error);
    }
};

debugIds();
