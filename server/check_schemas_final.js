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
        console.log("--- Modules Schema ---");
        const res1 = await db.execute("PRAGMA table_info(modules)");
        console.table(res1.rows);

        console.log("\n--- Mock Tests Schema ---");
        const res2 = await db.execute("PRAGMA table_info(mock_tests)");
        console.table(res2.rows);

    } catch (err) {
        console.error(err);
    }
}

run();
