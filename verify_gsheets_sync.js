import { db } from './server/db.js';
import { getAuthenticatedSheets } from './server/routes/youtube.js';

// Mocking getAuthenticatedSheets for testing
const mockSheets = {
    spreadsheets: {
        values: {
            get: async () => ({
                data: {
                    values: [
                        ['Name', 'Email', 'Duration'],
                        ['Prudhvi Raj', 'student@gmail.com', '60'],
                        ['Test User', 'test@user.com', '45']
                    ]
                }
            })
        }
    }
};

async function testSync() {
    console.log("--- Starting sync test ---");

    try {
        // 1. Get a class ID
        const classRes = await db.execute("SELECT id FROM classes LIMIT 1");
        if (classRes.rows.length === 0) {
            console.error("No classes found in DB. Please add a class first.");
            return;
        }
        const classId = classRes.rows[0].id;
        console.log(`Testing with Class ID: ${classId}`);

        // 2. Ensure student@gmail.com exists and is enrolled (mocking this check)
        // In the real app, we check enrollment. For the test, we'll just see if it updates.

        // Manually trigger the logic that would be in the route
        const rows = mockSheets.spreadsheets.values.get().then(res => res.data.values);
        const values = await rows;
        const emailsFromSheet = values.slice(1).map(r => r[1].toLowerCase().trim());
        
        console.log("Emails from sheet:", emailsFromSheet);

        // Fetch students to match
        const studentsRes = await db.execute(`
            SELECT u.id, u.email FROM users u WHERE u.role = 'student'
        `);
        const students = studentsRes.rows;

        let syncCount = 0;
        for (const student of students) {
            if (emailsFromSheet.includes(student.email.toLowerCase().trim())) {
                console.log(`Matching student: ${student.email}`);
                await db.execute({
                    sql: `INSERT INTO attendance (class_id, student_id, status) 
                          VALUES (?, ?, 'Present') 
                          ON CONFLICT(class_id, student_id) 
                          DO UPDATE SET status = 'Present', updated_at = CURRENT_TIMESTAMP`,
                    args: [classId, student.id]
                });
                syncCount++;
            }
        }

        console.log(`Sync test completed. Marked ${syncCount} students as Present.`);

        // Verify results
        const checkRes = await db.execute({
            sql: "SELECT * FROM attendance WHERE class_id = ? AND status = 'Present'",
            args: [classId]
        });
        console.log("Attendance records in DB:", checkRes.rows.length);

    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        process.exit();
    }
}

testSync();
