import { createClient } from "@libsql/client";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'server/.env') });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
    const usersRes = await db.execute("SELECT id, name, email, role, batch_id FROM users WHERE role = 'student'");
    const users = usersRes.rows;

    const fullInfo = await Promise.all(users.map(async user => {
        const enrollRes = await db.execute({
            sql: "SELECT e.*, c.title FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.student_id = ?",
            args: [user.id]
        });
        
        let batchCourses = [];
        if (user.batch_id) {
            const bcRes = await db.execute({
                sql: "SELECT bc.*, c.title FROM batch_courses bc JOIN courses c ON bc.course_id = c.id WHERE bc.batch_id = ?",
                args: [user.batch_id]
            });
            batchCourses = bcRes.rows;
        }

        return { ...user, enrollments: enrollRes.rows, batchCourses };
    }));

    console.log(JSON.stringify(fullInfo, null, 2));
}

main().catch(console.error);
