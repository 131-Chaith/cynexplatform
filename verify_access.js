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

async function verifyAccess() {
    try {
        console.log("Setting up test data...");

        // 1. Create a test batch
        await db.execute("INSERT INTO batches (id, batch_name, start_date, end_date) VALUES (999, 'Test Batch', '2026-01-01', '2026-12-31') ON CONFLICT(id) DO NOTHING");

        // 2. Create a test student assigned to batch
        await db.execute("INSERT INTO users (id, name, email, password, role, batch_id) VALUES (999, 'Test Student', 'teststudent@example.com', 'hashedpassword', 'student', 999) ON CONFLICT(id) DO UPDATE SET batch_id = 999");

        // 3. Create a test course
        await db.execute("INSERT INTO courses (id, title, description, duration) VALUES (999, 'Test Course', 'Description', '10h') ON CONFLICT(id) DO NOTHING");

        // 4. Assign course to batch
        await db.execute("INSERT INTO batch_courses (batch_id, course_id) VALUES (999, 999) ON CONFLICT DO NOTHING");

        // 5. Create a module linked to course
        await db.execute("INSERT INTO modules (id, title, description) VALUES (999, 'Test Module', 'Desc') ON CONFLICT(id) DO NOTHING");
        await db.execute("INSERT INTO course_modules (course_id, module_id) VALUES (999, 999) ON CONFLICT DO NOTHING");

        // 6. Create a video linked to course
        await db.execute("INSERT INTO videos (id, title, youtube_url, course_id) VALUES (999, 'Test Video', 'https://youtube.com/watch?v=test', 999) ON CONFLICT(id) DO NOTHING");

        console.log("Test data ready. Verifying access logic...");

        // Simulate GET /courses for student 999
        const courses = await db.execute({
            sql: `
                SELECT DISTINCT c.* 
                FROM courses c 
                LEFT JOIN enrollments e ON c.id = e.course_id AND e.student_id = ?
                LEFT JOIN batch_courses bc ON c.id = bc.course_id
                LEFT JOIN users u ON u.batch_id = bc.batch_id AND u.id = ?
                WHERE e.student_id IS NOT NULL OR u.id IS NOT NULL
            `,
            args: [999, 999]
        });
        console.log(`Courses found: ${courses.rows.length} (Expected >= 1 containing ID 999)`);
        const foundCourse = courses.rows.find(c => c.id === 999);
        if (foundCourse) console.log("✅ Course access verified!");
        else console.error("❌ Course access FAILED!");

        // Simulate GET /videos for student 999
        const videos = await db.execute({
            sql: `SELECT * FROM videos WHERE course_id IN (
                    SELECT course_id FROM enrollments WHERE student_id = ?
                    UNION
                    SELECT bc.course_id 
                    FROM batch_courses bc
                    JOIN users u ON u.batch_id = bc.batch_id
                    WHERE u.id = ?
                ) AND id = 999`,
            args: [999, 999]
        });
        console.log(`Videos found: ${videos.rows.length} (Expected 1)`);
        if (videos.rows.length > 0) console.log("✅ Video access verified!");
        else console.error("❌ Video access FAILED!");

        // Simulate GET /modules for student 999
        const modules = await db.execute({
            sql: `
                SELECT DISTINCT m.* 
                FROM modules m
                JOIN course_modules cm ON m.id = cm.module_id
                LEFT JOIN enrollments e ON cm.course_id = e.course_id AND e.student_id = ?
                LEFT JOIN batch_courses bc ON cm.course_id = bc.course_id
                LEFT JOIN users u ON u.batch_id = bc.batch_id AND u.id = ?
                WHERE (e.student_id IS NOT NULL OR u.id IS NOT NULL) AND m.id = 999
            `,
            args: [999, 999]
        });
        console.log(`Modules found: ${modules.rows.length} (Expected 1)`);
        if (modules.rows.length > 0) console.log("✅ Module access verified!");
        else console.error("❌ Module access FAILED!");

        // Cleanup
        console.log("Cleaning up test data...");
        await db.execute("DELETE FROM videos WHERE id = 999");
        await db.execute("DELETE FROM course_modules WHERE course_id = 999 AND module_id = 999");
        await db.execute("DELETE FROM modules WHERE id = 999");
        await db.execute("DELETE FROM batch_courses WHERE batch_id = 999 AND course_id = 999");
        await db.execute("DELETE FROM courses WHERE id = 999");
        await db.execute("DELETE FROM users WHERE id = 999");
        await db.execute("DELETE FROM batches WHERE id = 999");
        console.log("Cleanup done.");

    } catch (error) {
        console.error("Test failed:", error);
    }
}

verifyAccess();
