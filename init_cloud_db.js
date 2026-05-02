import { createClient } from "@libsql/client";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'server/.env') });

async function initCloud() {
    console.log("--- 🏗️ Cynex Cloud Schema Initializer ---");
    
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
        // Get all tables and their CREATE statements from local
        const tablesRes = await localDb.execute("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
        
        console.log(`📊 Found ${tablesRes.rows.length} tables to initialize.`);

        for (const row of tablesRes.rows) {
            const tableName = row.name;
            const createSql = row.sql;

            if (!createSql) continue;

            console.log(`⏳ Creating table: ${tableName}...`);
            try {
                // Ensure we don't try to create tables that already exist
                const cleanSql = createSql.replace(/CREATE TABLE/i, 'CREATE TABLE IF NOT EXISTS');
                await cloudDb.execute(cleanSql);
                console.log(`   ✅ Table ${tableName} is ready.`);
            } catch (err) {
                console.error(`   ❌ Failed to create ${tableName}:`, err.message);
            }
        }

        console.log("\n✨ Cloud database schema is now synchronized!");
        console.log("🚀 Proceeding to sync data...");
    } catch (error) {
        console.error("\n❌ Initialization failed:", error.message);
    } finally {
        // We don't exit here so we can call the sync logic next if needed
    }
}

initCloud();
