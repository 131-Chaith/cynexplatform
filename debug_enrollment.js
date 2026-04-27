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

const debugEnrollment = async () => {
    try {
        console.log("Fetching courses...");
        const courses = await db.execute("SELECT * FROM courses");
        console.table(courses.rows);

        console.log("\nFetching Venky...");
        const user = await db.execute("SELECT * FROM users WHERE name LIKE '%Venky%'");
        console.table(user.rows);

        if (user.rows.length > 0 && courses.rows.length > 0) {
            const studentId = user.rows[0].id; // 6
            const courseId = courses.rows[0].id; // Likely 1 or similar

            console.log(`\nAttempting to enroll Student ${studentId} into Course ${courseId}...`);

            try {
                await db.execute({
                    sql: "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)",
                    args: [studentId, courseId]
                });
                console.log("Enrollment SUCCESS!");
            } catch (err) {
                console.error("Enrollment FAILED:", err.message);
            }
        } else {
            console.log("Missing user or course data to test.");
        }

    } catch (error) {
        console.error("Error:", error);
    }
};

debugEnrollment();
