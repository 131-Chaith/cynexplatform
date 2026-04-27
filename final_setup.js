import { createClient } from "@libsql/client";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'server/.env') });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
    try {
        console.log("Starting final setup...");

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

        // 2. Identify Course
        const courseId = 4; // Python Developer
        const courseCheck = await db.execute({ sql: "SELECT title FROM courses WHERE id = ?", args: [courseId] });
        if (courseCheck.rows.length === 0) {
            throw new Error("Course ID 4 (Python Developer) not found!");
        }
        console.log(`Target Course: ${courseCheck.rows[0].title} (ID: ${courseId})`);

        // 3. Clear existing enrollments for this student
        console.log(`Ensuring student ${studentId} is ONLY enrolled in course ${courseId}...`);
        await db.execute({ sql: "DELETE FROM enrollments WHERE student_id = ?", args: [studentId] });
        await db.execute({ sql: "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)", args: [studentId, courseId] });

        // 4. Add Related Content to Course 4
        console.log("Adding related videos, assignments, and mock tests to the course...");

        // Add Videos
        const videos = [
            { title: "Introduction to Python", url: "https://www.youtube.com/watch?v=rfscVS0vtbw", duration: "15:00" },
            { title: "Python Variables and Data Types", url: "https://www.youtube.com/watch?v=vLqTf2b6GZw", duration: "20:00" },
            { title: "Control Flow in Python", url: "https://www.youtube.com/watch?v=Zp5MuPOtsSY", duration: "25:00" }
        ];

        for (const v of videos) {
            // Check if already exists
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
            { title: "Python Basics Quiz", description: "Write a simple script to calculate area of a circle.", due: "2026-05-01" },
            { title: "List and Tuples Lab", description: "Implement a student record system using lists.", due: "2026-05-10" }
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
            {
                id: 1,
                question: "What is the correct extension of the Python file?",
                options: [".python", ".pl", ".py", ".p"],
                correctAnswer: 2
            },
            {
                id: 2,
                question: "Which of the following is used to define a block of code in Python language?",
                options: ["Indentation", "Key", "Brackets", "All of the mentioned"],
                correctAnswer: 0
            }
        ]);

        const tests = [
            { title: "Python Fundamental Test", duration: 30, marks: 50, q: questions },
            { title: "Data Structures in Python", duration: 45, marks: 100, q: questions }
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

        console.log("✅ Setup completed successfully!");
        console.log(`Student Login: ${email} / ${password}`);

    } catch (error) {
        console.error("❌ Setup failed:", error);
    }
}

main().catch(console.error);
