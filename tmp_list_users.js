import { db } from './server/db.js';

async function listUsers() {
    try {
        const result = await db.execute("SELECT name, email, role FROM users");
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (error) {
        console.error("Error listing users:", error);
    }
}

listUsers();
