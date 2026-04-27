import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    try {
        console.log("--- Module 6 ---");
        const mod = await db.execute({
            sql: "SELECT * FROM modules WHERE id = ?",
            args: [6]
        });
        console.log(mod.rows[0]);

        if (mod.rows[0]) {
            console.log("\n--- Parent Course ---");
            const course = await db.execute({
                sql: "SELECT * FROM courses WHERE id = ?",
                args: [mod.rows[0].course_id]
            });
            console.log(course.rows[0]);
        }
    } catch (err) {
        console.error(err);
    }
}

run();
