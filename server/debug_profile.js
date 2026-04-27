import { db } from './db.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        console.log("--- USERS SCHEMA ---");
        const users = await db.execute("PRAGMA table_info(users)");
        console.log(users.rows.map(r => r.name).join(', '));
        
        console.log("\n--- STUDENTS SCHEMA ---");
        const students = await db.execute("PRAGMA table_info(students)");
        console.log(students.rows.map(r => r.name).join(', '));
        
        console.log("\n--- CURRENT USER (RAJ) ---");
        const raj = await db.execute({
            sql: "SELECT * FROM users WHERE email LIKE '%raj%'",
            args: []
        });
        console.log(raj.rows);
        
        if (raj.rows.length > 0) {
            console.log("\n--- RAJ STUDENT PROFILE ---");
            const rajProfile = await db.execute({
                sql: "SELECT * FROM students WHERE user_id = ?",
                args: [raj.rows[0].id]
            });
            console.log(rajProfile.rows);
        }

    } catch (e) { console.error(e); }
}

check();
