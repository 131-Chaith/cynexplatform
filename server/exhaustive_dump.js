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
        const res = await db.execute("SELECT * FROM test_results");
        console.log("Total Results:", res.rows.length);
        res.rows.forEach(r => {
            console.log(`ID: ${r.id}, Student: ${r.student_id}, Test: ${r.test_id}, Score: ${r.score}`);
        });

        const users = await db.execute("SELECT id, name FROM users");
        console.log("\nUsers:");
        users.rows.forEach(u => console.log(`${u.id}: ${u.name}`));

    } catch (err) {
        console.error(err);
    }
}

run();
