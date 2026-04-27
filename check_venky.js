import { createClient } from "@libsql/client";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'server/.env') });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const checkVenky = async () => {
    try {
        console.log("Checking Venky...");
        const user = await db.execute("SELECT * FROM users WHERE email LIKE '%venky%' OR name LIKE '%Venky%'");
        console.table(user.rows);

        if (user.rows.length > 0) {
            const userId = user.rows[0].id;
            console.log(`\nChecking enrollments for User ID ${userId}...`);
            const enrollments = await db.execute({
                sql: "SELECT * FROM enrollments WHERE student_id = ?",
                args: [userId]
            });
            console.table(enrollments.rows);
        }
    } catch (error) {
        console.error("Error:", error);
    }
};

checkVenky();
