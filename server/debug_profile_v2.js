import { db } from './db.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        const uInfo = await db.execute("PRAGMA table_info(users)");
        console.log("USERS COLUMNS:", uInfo.rows.map(r => r.name).join(', '));
        
        const sInfo = await db.execute("PRAGMA table_info(students)");
        console.log("STUDENTS COLUMNS:", sInfo.rows.map(r => r.name).join(', '));
        
        const raj = await db.execute("SELECT id, name, email, role FROM users WHERE email LIKE '%raj%'");
        console.log("RAJ USER:", raj.rows[0]);
        
        if (raj.rows[0]) {
            const profile = await db.execute({
                sql: "SELECT * FROM students WHERE user_id = ?",
                args: [raj.rows[0].id]
            });
            console.log("RAJ PROFILE:", profile.rows[0]);
        }
    } catch (e) {
        console.error("ERROR:", e);
    }
}
check();
