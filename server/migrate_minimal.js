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
        console.log("Running migration...");
        const res = await db.execute("ALTER TABLE mock_tests ADD COLUMN module_id INTEGER");
        console.log("Result:", res);
    } catch (err) {
        console.error("FAILED:", err);
    }
}

run();
