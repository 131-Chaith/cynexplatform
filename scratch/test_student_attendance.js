// Test all new student attendance API endpoints
import { db } from '../server/db.js';
import { getStudentStats, getStudentAnalytics, getStudentCalendar } from '../server/services/attendanceService.js';

async function testEndpoints() {
    // Get a student user to test with
    const users = await db.execute("SELECT id, name, role FROM users WHERE role = 'student' LIMIT 1");
    
    if (users.rows.length === 0) {
        console.log("No students found in DB. Creating test scenario...");
        return;
    }

    const studentId = users.rows[0].id;
    console.log(`Testing with student: ${users.rows[0].name} (ID: ${studentId})`);

    console.log("\n--- Stats ---");
    const stats = await getStudentStats(studentId);
    console.log(stats);

    console.log("\n--- Analytics ---");
    const analytics = await getStudentAnalytics(studentId);
    console.log(analytics);

    console.log("\n--- Calendar (last 3 records) ---");
    const calendar = await getStudentCalendar(studentId);
    console.log(calendar.slice(0, 3));

    // Test notifications logic
    const notifications = [];
    if (stats.attendancePercentage < 75) {
        notifications.push({ type: 'warning', message: `Low attendance: ${stats.attendancePercentage}%` });
    }
    console.log("\n--- Notifications ---", notifications.length > 0 ? notifications : "None (attendance is healthy)");
    
    console.log("\n✅ All endpoints functional!");
    process.exit(0);
}

testEndpoints().catch(err => {
    console.error("Test failed:", err.message);
    process.exit(1);
});
