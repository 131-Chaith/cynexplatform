import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "server", ".env") });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function debug() {
    try {
        const results = await db.execute("SELECT * FROM test_results ORDER BY completed_at DESC LIMIT 3");
        console.log("Found results:", results.rows.length);
        results.rows.forEach(r => {
            console.log("ID:", r.id);
            console.log("Score:", r.score);
            console.log("Answers:", r.answers);
            console.log("Answers type:", typeof r.answers);
        });
    } catch (e) {
        console.error(e);
    }
}
debug();
