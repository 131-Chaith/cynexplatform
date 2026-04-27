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
        const res = await db.execute("SELECT sql FROM sqlite_master WHERE name='mock_tests'");
        console.log(res.rows[0].sql);
    } catch (err) {
        console.error(err);
    }
}

run();
