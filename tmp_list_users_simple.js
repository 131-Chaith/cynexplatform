import { db } from './server/db.js';

async function listUsers() {
    try {
        const result = await db.execute("SELECT name, email, role FROM users");
        for (const row of result.rows) {
            console.log(`- name: ${row.name}, email: ${row.email}, role: ${row.role}`);
        }
    } catch (error) {
        console.error("Error listing users:", error);
    }
}

listUsers();
