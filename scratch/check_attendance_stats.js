import { db } from '../server/db.js';

async function checkAttendanceData() {
    try {
        console.log("--- Tables ---");
        const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log(tables.rows.map(r => r.name));

        console.log("\n--- Classes Count ---");
        const classes = await db.execute("SELECT COUNT(*) as count FROM classes");
        console.log("Total Classes:", classes.rows[0].count);

        console.log("\n--- Attendance Count ---");
        const attendance = await db.execute("SELECT COUNT(*) as count FROM attendance");
        console.log("Total Attendance Records:", attendance.rows[0].count);

        console.log("\n--- Sample Classes ---");
        const sampleClasses = await db.execute("SELECT * FROM classes LIMIT 5");
        console.table(sampleClasses.rows);

        console.log("\n--- Sample Attendance ---");
        const sampleAttendance = await db.execute("SELECT * FROM attendance LIMIT 5");
        console.table(sampleAttendance.rows);

        console.log("\n--- Enrollments Count ---");
        const enrollments = await db.execute("SELECT COUNT(*) as count FROM enrollments");
        console.log("Total Enrollments:", enrollments.rows[0].count);

        console.log("\n--- Batch Courses Count ---");
        const batchCourses = await db.execute("SELECT COUNT(*) as count FROM batch_courses");
        console.log("Total Batch Courses:", batchCourses.rows[0].count);

    } catch (err) {
        console.error(err);
    }
    process.exit();
}

checkAttendanceData();
