import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function testAll() {
    try {
        const users = await db.execute("SELECT id, name FROM users");
        console.log(`Testing ${users.rows.length} users...`);

        for (const user of users.rows) {
            try {
                await db.execute("INSERT INTO students (user_id) VALUES (?)", [user.id]);
                console.log(`✅ SUCCESS for ${user.name} (ID: ${user.id})`);
                await db.execute("DELETE FROM students WHERE user_id = ?", [user.id]);
            } catch (e) {
                console.log(`❌ FAILED for ${user.name} (ID: ${user.id}): ${e.message}`);
                if (e.cause) console.log(`   Cause: ${e.cause.message}`);
            }
        }

    } catch (e) {
        console.error("TEST ERROR:", e);
    }
}

testAll();
