import { db } from './server/db.js';
import fs from 'fs';

async function listUsers() {
    try {
        const result = await db.execute("SELECT name, email, role FROM users");
        let content = "";
        for (const row of result.rows) {
            content += `- name: ${row.name}, email: ${row.email}, role: ${row.role}\n`;
        }
        fs.writeFileSync('tmp_users.txt', content, 'utf-8');
        console.log("Written to tmp_users.txt");
    } catch (error) {
        console.error("Error listing users:", error);
    }
}

listUsers();
