import { createClient } from "@libsql/client";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config(); // Loads .env from current directory (server/.env)

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
    try {
        console.log("Starting student task setup...");

        // 1. Identify/Create Student
        const email = 'student@gmail.com';
        const password = 'student123';
        const hashedPassword = await bcrypt.hash(password, 10);

        const userCheck = await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [email] });
        let studentId;

        if (userCheck.rows.length === 0) {
            console.log(`Creating student ${email}...`);
            const res = await db.execute({
                sql: "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'student') RETURNING id",
                args: ['Student User', email, hashedPassword]
            });
            studentId = res.rows[0].id;
        } else {
            studentId = userCheck.rows[0].id;
            console.log(`Student ${email} already exists (ID: ${studentId}). Updating password...`);
            await db.execute({
                sql: "UPDATE users SET password = ?, role = 'student', batch_id = NULL WHERE id = ?",
                args: [hashedPassword, studentId]
            });
        }

        // 2. Target Course: Python Developer (ID 4)
        const courseId = 4;
        const courseCheck = await db.execute({ sql: "SELECT title FROM courses WHERE id = ?", args: [courseId] });
        if (courseCheck.rows.length === 0) {
            console.error("Course ID 4 (Python Developer) not found! Checking other courses...");
            const allCourses = await db.execute("SELECT id, title FROM courses");
            console.table(allCourses.rows);
            return;
        }
        
        console.log(`Targeting Course: ${courseCheck.rows[0].title} (ID: ${courseId})`);

        // 3. Clear existing enrollments for this student and enroll in only ONE course
        console.log(`Ensuring student ${studentId} is ONLY enrolled in course ${courseId}...`);
        await db.execute({ sql: "DELETE FROM enrollments WHERE student_id = ?", args: [studentId] });
        await db.execute({ sql: "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)", args: [studentId, courseId] });

        // 4. Add Related Content to Course 4
        console.log("Adding related videos, assignments, and mock tests to the course...");

        // Add Videos
        const videos = [
            { title: "Basics of Python", url: "https://www.youtube.com/watch?v=rfscVS0vtbw", duration: "10:20" },
            { title: "Python Lists and Dictionaries", url: "https://www.youtube.com/watch?v=daofaK78_os", duration: "12:45" }
        ];

        for (const v of videos) {
            const vCheck = await db.execute({ sql: "SELECT id FROM videos WHERE title = ? AND course_id = ?", args: [v.title, courseId] });
            if (vCheck.rows.length === 0) {
                await db.execute({
                    sql: "INSERT INTO videos (title, youtube_url, course_id, duration) VALUES (?, ?, ?, ?)",
                    args: [v.title, v.url, courseId, v.duration]
                });
            }
        }

        // Add Assignments
        const assignments = [
            { title: "Python Calculation Task", description: "Write a program that takes two numbers and performs arithmetic operations.", due: "2026-04-15" },
            { title: "String Manipulation Lab", description: "Implement a function that reverses a given string and counts vowels.", due: "2026-04-20" }
        ];

        for (const a of assignments) {
            const aCheck = await db.execute({ sql: "SELECT id FROM assignments WHERE title = ? AND course_id = ?", args: [a.title, courseId] });
            if (aCheck.rows.length === 0) {
                await db.execute({
                    sql: "INSERT INTO assignments (course_id, title, description, due_date) VALUES (?, ?, ?, ?)",
                    args: [courseId, a.title, a.description, a.due]
                });
            }
        }

        // Add Mock Tests
        const questions = JSON.stringify([
            { id: 1, question: "What is Python?", options: ["A snake", "A programming language", "A coffee brand", "A movie"], correctAnswer: 1 },
            { id: 2, question: "Who created Python?", options: ["Guido van Rossum", "Elon Musk", "Bill Gates", "Mark Zuckerberg"], correctAnswer: 0 }
        ]);

        const tests = [
            { title: "Python Introductory Mock Test", duration: 20, marks: 10, q: questions },
            { title: "Advanced Python syntax", duration: 30, marks: 20, q: questions }
        ];

        for (const t of tests) {
            const tCheck = await db.execute({ sql: "SELECT id FROM mock_tests WHERE title = ? AND course_id = ?", args: [t.title, courseId] });
            if (tCheck.rows.length === 0) {
                await db.execute({
                    sql: "INSERT INTO mock_tests (course_id, title, duration, total_marks, questions) VALUES (?, ?, ?, ?, ?)",
                    args: [courseId, t.title, t.duration, t.marks, t.q]
                });
            }
        }

        console.log("✅ FULFILLED: Student enrolled in 1 course with all related objects.");
        console.log(`CREDS: ${email} | ${password}`);

    } catch (error) {
        console.error("❌ Setup failed:", error.message);
    }
}

main().catch(console.error);
