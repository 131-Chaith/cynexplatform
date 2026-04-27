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

async function probe() {
    try {
        console.log("=== TABLES ===");
        const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
        for (const t of tables.rows) {
            console.log(`\n--- TABLE: ${t.name} ---`);
            const schema = await db.execute(`SELECT sql FROM sqlite_master WHERE name='${t.name}'`);
            console.log(schema.rows[0].sql);

            const fks = await db.execute(`PRAGMA foreign_key_list('${t.name}')`);
            if (fks.rows.length > 0) {
                console.log("Foreign Keys:");
                fks.rows.forEach(r => console.log(`  ${r.from} -> ${r.table}(${r.to})`));
            }
        }

        console.log("\n=== TRIGGERS ===");
        const triggers = await db.execute("SELECT name, sql FROM sqlite_master WHERE type='trigger'");
        triggers.rows.forEach(r => console.log(`Trigger: ${r.name}\n${r.sql}`));

        console.log("\n=== DATA CHECK FOR USER 5 ===");
        const user5 = await db.execute("SELECT * FROM users WHERE id = 5");
        console.log("User 5 row:", JSON.stringify(user5.rows[0]));

        const student5 = await db.execute("SELECT * FROM students WHERE user_id = 5");
        console.log("Student Profile for User 5:", JSON.stringify(student5.rows[0]));

        console.log("\n=== PARENT TABLES CHECK ===");
        const batchIds = await db.execute("SELECT id FROM batches");
        console.log("Valid Batches:", batchIds.rows.map(r => r.id));

    } catch (e) {
        console.error("PROBE ERROR:", e);
    }
}

probe();
