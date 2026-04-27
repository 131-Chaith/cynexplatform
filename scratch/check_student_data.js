import { db } from '../server/db.js';

async function checkStudentEnrollments(studentId) {
    try {
        console.log(`\n--- Enrollments for Student ${studentId} ---`);
        const enrollments = await db.execute({
            sql: "SELECT * FROM enrollments WHERE student_id = ?",
            args: [studentId]
        });
        console.table(enrollments.rows);

        console.log(`\n--- User Info for ${studentId} ---`);
        const user = await db.execute({
            sql: "SELECT id, name, email, batch_id FROM users WHERE id = ?",
            args: [studentId]
        });
        console.table(user.rows);

        const batchId = user.rows[0]?.batch_id;
        if (batchId) {
            console.log(`\n--- Batch Courses for Batch ${batchId} ---`);
            const batchCourses = await db.execute({
                sql: "SELECT * FROM batch_courses WHERE batch_id = ?",
                args: [batchId]
            });
            console.table(batchCourses.rows);
        }

    } catch (err) {
        console.error(err);
    }
    process.exit();
}

// Assuming studentId 1001 based on the sample attendance record
checkStudentEnrollments(1001);
