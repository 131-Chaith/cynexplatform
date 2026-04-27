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

async function listCourses() {
    try {
        const courses = await db.execute("SELECT id, title FROM courses");
        console.table(courses.rows);
    } catch (error) {
        console.error("Error:", error);
    }
}

listCourses();
