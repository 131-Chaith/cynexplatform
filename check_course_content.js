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

async function checkContent() {
    try {
        const courseId = 3;
        console.log(`Checking content for Course ID: ${courseId}`);

        // 1. Classes
        const classes = await db.execute({
            sql: "SELECT * FROM classes WHERE course_id = ?",
            args: [courseId]
        });
        console.log(`Classes (${classes.rows.length}):`, classes.rows);

        // 2. Modules
        const modules = await db.execute({
            sql: `SELECT m.* FROM modules m 
                   JOIN course_modules cm ON m.id = cm.module_id 
                   WHERE cm.course_id = ?`,
            args: [courseId]
        });
        console.log(`Modules (${modules.rows.length}):`, modules.rows);

        // 3. Check items inside modules
        for (const mod of modules.rows) {
            const matches = await db.execute({
                sql: "SELECT * FROM assignments WHERE module_id = ?",
                args: [mod.id]
            });
            console.log(`  Assignments for Module ${mod.id}:`, matches.rows);

            const tests = await db.execute({
                sql: "SELECT * FROM mock_tests WHERE module_id = ?",
                args: [mod.id]
            });
            console.log(`  Tests for Module ${mod.id}:`, tests.rows);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

checkContent();
