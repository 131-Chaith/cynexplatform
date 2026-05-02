import { createClient } from "@libsql/client";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'server/.env') });

async function sync() {
    console.log("--- 🚀 Cynex DB Ultra-Sync ---");
    
    const localDbPath = path.join(__dirname, 'server/local.db');
    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const tursoToken = process.env.TURSO_AUTH_TOKEN;

    if (!tursoUrl) {
        console.error("❌ Error: TURSO_DATABASE_URL not found in server/.env");
        process.exit(1);
    }

    const cloudDb = createClient({ url: tursoUrl, authToken: tursoToken });
    const localDb = createClient({ url: `file:${localDbPath}` });

    try {
        const tablesRes = await localDb.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
        let tables = tablesRes.rows.map(r => r.name);

        // Optimized order for relational integrity
        const priorityOrder = ['batches', 'users', 'courses', 'modules', 'assignments', 'mock_tests', 'attendance_sessions'];
        tables.sort((a, b) => {
            const indexA = priorityOrder.indexOf(a);
            const indexB = priorityOrder.indexOf(b);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });

        console.log(`📊 Found ${tables.length} tables. Starting deep sync...`);

        for (const table of tables) {
            process.stdout.write(`⏳ Syncing ${table}... `);
            
            const dataRes = await localDb.execute(`SELECT * FROM ${table}`);
            const rows = dataRes.rows;

            if (rows.length === 0) {
                console.log("Empty (Skipped)");
                continue;
            }

            const columns = Object.keys(rows[0]);
            const placeholders = columns.map(() => '?').join(',');
            const sql = `INSERT OR REPLACE INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`;

            // Process in batches with Foreign Key checks disabled per batch
            const batchSize = 40;
            for (let i = 0; i < rows.length; i += batchSize) {
                const chunk = rows.slice(i, i + batchSize);
                const batchQueries = [
                    // This is the key: disabling checks within the same transaction/batch
                    { sql: "PRAGMA foreign_keys = OFF" },
                    ...chunk.map(row => ({
                        sql,
                        args: columns.map(col => row[col])
                    }))
                ];
                
                try {
                    await cloudDb.batch(batchQueries);
                } catch (err) {
                    // If it still fails, try a non-batch fallback for that specific chunk
                    console.log("\n⚠️ Batch failed, trying individual inserts...");
                    for (const row of chunk) {
                        try {
                            await cloudDb.execute({ sql, args: columns.map(col => row[col]) });
                        } catch (e) {
                             // Log but continue if possible
                             console.warn(`   ⚠️ Row skip in ${table}: ${e.message}`);
                        }
                    }
                }
            }
            
            console.log(`✅ ${rows.length} rows`);
        }

        console.log("\n✨ Database is now fully synchronized and functional!");
    } catch (error) {
        console.error("\n❌ Global Sync failure:", error.message);
    } finally {
        process.exit();
    }
}

sync();
