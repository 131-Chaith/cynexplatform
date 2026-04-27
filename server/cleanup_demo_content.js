import { createClient } from "@libsql/client";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
    try {
        console.log("Removing demo content as requested...");

        // Titles of items added in previous turn
        const demoTitles = {
            videos: ["Basics of Python", "Python Lists and Dictionaries", "Introduction to Python", "Python Variables and Data Types", "Control Flow in Python"],
            assignments: ["Python Calculation Task", "String Manipulation Lab", "Python Basics Quiz", "List and Tuples Lab"],
            tests: ["Python Introductory Mock Test", "Advanced Python syntax", "Python Fundamental Test", "Data Structures in Python"]
        };

        // 1. Delete Videos
        for (const title of demoTitles.videos) {
            const res = await db.execute({ sql: "DELETE FROM videos WHERE title = ?", args: [title] });
            if (res.rowsAffected > 0) console.log(`Deleted video: ${title}`);
        }

        // 2. Delete Assignments
        for (const title of demoTitles.assignments) {
             const res = await db.execute({ sql: "DELETE FROM assignments WHERE title = ?", args: [title] });
             if (res.rowsAffected > 0) console.log(`Deleted assignment: ${title}`);
        }

        // 3. Delete Mock Tests
        for (const title of demoTitles.tests) {
             const res = await db.execute({ sql: "DELETE FROM mock_tests WHERE title = ?", args: [title] });
             if (res.rowsAffected > 0) console.log(`Deleted test: ${title}`);
        }

        console.log("✅ Cleanup complete. Only admin-added content remains.");
    } catch (err) {
        console.error(err);
    }
}

main().catch(console.error);
