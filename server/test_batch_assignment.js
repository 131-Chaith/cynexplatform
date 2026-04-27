import 'dotenv/config';
import { db } from './db.js';

async function testBatchAssignment() {
    try {
        // Get a batch
        const batches = await db.execute("SELECT * FROM batches LIMIT 1");
        if (batches.rows.length === 0) {
            console.log("No batches found");
            return;
        }
        const batch = batches.rows[0];
        console.log("Testing with batch:", batch.batch_name, "(ID:", batch.id, ")");

        // Get a student
        const students = await db.execute("SELECT * FROM users WHERE role = 'student' LIMIT 1");
        if (students.rows.length === 0) {
            console.log("No students found");
            return;
        }
        const student = students.rows[0];
        console.log("Testing with student:", student.name, "(ID:", student.id, ")");

        // Try to assign student to batch
        console.log("\nAttempting to assign student to batch...");
        await db.execute({
            sql: "UPDATE users SET batch_id = ? WHERE id = ? AND role = 'student'",
            args: [batch.id, student.id]
        });
        console.log("✅ Assignment successful!");

        // Verify
        const updatedStudent = await db.execute({
            sql: "SELECT * FROM users WHERE id = ?",
            args: [student.id]
        });
        console.log("\nUpdated student batch_id:", updatedStudent.rows[0].batch_id);

    } catch (e) {
        console.error("❌ Error:", e.message);
    }
}

testBatchAssignment();
