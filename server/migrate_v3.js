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

async function migrate() {
    try {
        console.log("Adding module_id to mock_tests...");
        await db.execute("ALTER TABLE mock_tests ADD COLUMN module_id INTEGER");
        console.log("Adding answers to test_results if missing...");
        try {
            await db.execute("ALTER TABLE test_results ADD COLUMN answers JSON");
        } catch (e) {
            console.log("answers column probably exists");
        }
        console.log("Migration finished.");
    } catch (err) {
        console.error("Migration failed:", err);
    }
}

migrate();
