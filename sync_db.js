import { createClient } from "@libsql/client";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'server/.env') });

async function sync() {
    console.log("--- Cynex DB Auto-Sync ---");
    
    const localDbPath = path.join(__dirname, 'server/local.db');
    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const tursoToken = process.env.TURSO_AUTH_TOKEN;

    if (!tursoUrl) {
        console.error("❌ Error: TURSO_DATABASE_URL not found in server/.env");
        process.exit(1);
    }

    console.log(`📡 Connecting to Cloud DB: ${tursoUrl}`);
    const cloudDb = createClient({ url: tursoUrl, authToken: tursoToken });

    console.log(`📂 Connecting to Local DB: ${localDbPath}`);
    const localDb = createClient({ url: `file:${localDbPath}` });

    try {
        // Get all tables
        const tablesRes = await localDb.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
        const tables = tablesRes.rows.map(r => r.name);

        console.log(`📊 Found ${tables.length} tables to sync.`);

        for (const table of tables) {
            console.log(`⏳ Syncing table: ${table}...`);
            
            // Get data from local
            const dataRes = await localDb.execute(`SELECT * FROM ${table}`);
            const rows = dataRes.rows;

            if (rows.length === 0) {
                console.log(`   - Table ${table} is empty, skipping.`);
                continue;
            }

            // Clear cloud table (optional, but safer for a full sync)
            // await cloudDb.execute(`DELETE FROM ${table}`);

            // Prepare batch insert
            // Note: This is a simplified approach. For large tables, use chunks.
            const columns = Object.keys(rows[0]);
            const placeholders = columns.map(() => '?').join(',');
            
            for (const row of rows) {
                const values = columns.map(col => row[col]);
                await cloudDb.execute({
                    sql: `INSERT OR REPLACE INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`,
                    args: values
                });
            }
            console.log(`   ✅ Synced ${rows.length} rows to ${table}.`);
        }

        console.log("\n✨ Database synchronization complete!");
    } catch (error) {
        console.error("\n❌ Sync failed:", error.message);
        if (error.message.includes("404")) {
            console.error("💡 Tip: Your Turso URL might be incorrect or the database was deleted.");
        }
    } finally {
        process.exit();
    }
}

sync();
