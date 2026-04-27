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
        const res = await db.execute("SELECT * FROM modules LIMIT 1");
        if (res.rows.length > 0) {
            console.log("Keys:", Object.keys(res.rows[0]));
            console.log("Row:", res.rows[0]);
        } else {
            console.log("Modules table is empty.");
        }
    } catch (err) {
        console.error(err);
    }
}

run();
