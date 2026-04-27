import { db } from './db.js';

async function checkStudents() {
    try {
        const users = await db.execute("SELECT id, name, email, role, batch_id FROM users");
        console.log("--- Users ---");
        users.rows.forEach(r => console.log(r));

        const batches = await db.execute("SELECT id, batch_name FROM batches");
        console.log("\n--- Batches ---");
        batches.rows.forEach(r => console.log(r));

        const activeSessions = await db.execute("SELECT id, type, batch_id, topic, status FROM attendance_sessions");
        console.log("\n--- Active Sessions ---");
        activeSessions.rows.forEach(r => console.log(r));

    } catch (e) {
        console.error(e);
    }
}

checkStudents();
