import { createClient } from "@libsql/client";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
    try {
        const email = 'x@gmail.com';
        const password = '1234';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log(`Creating/Updating student ${email}...`);
        
        // 1. Create User
        await db.execute({
            sql: "DELETE FROM users WHERE email = ?",
            args: [email]
        });
        
        const userRes = await db.execute({
            sql: "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'student') RETURNING id",
            args: ['Example Student', email, hashedPassword]
        });
        const userId = userRes.rows[0].id;

        // 2. Enroll in Python Developer (ID 4)
        await db.execute({
            sql: "INSERT INTO enrollments (student_id, course_id) VALUES (?, 4)",
            args: [userId]
        });

        // 3. Create Student Profile (required for some views)
        await db.execute({
            sql: "INSERT INTO students (user_id, gender) VALUES (?, 'Male')",
            args: [userId]
        });

        console.log("✅ Success! Student x@gmail.com created and enrolled in Python Developer.");
    } catch (err) {
        console.error(err);
    }
}

main().catch(console.error);
