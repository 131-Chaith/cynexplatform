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
        console.log("Fixing data...");
        // Set module_id to 1 (SQL) for test ID 1 (SQL)
        await db.execute("UPDATE mock_tests SET module_id = 1 WHERE id = 1");
        console.log("Done.");
    } catch (err) {
        console.error(err);
    }
}

run();
