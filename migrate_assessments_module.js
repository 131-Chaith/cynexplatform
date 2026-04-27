import { createClient } from "@libsql/client";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'server/.env') });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const migrate = async () => {
    try {
        console.log("Migrating assessments to support modules...");

        const tables = ['assignments', 'mock_tests'];
        for (const table of tables) {
            const res = await db.execute(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${table}'`);
            const sql = res.rows[0].sql;
            if (!sql.includes('module_id')) {
                console.log(`Adding module_id to ${table}...`);
                await db.execute(`ALTER TABLE ${table} ADD COLUMN module_id INTEGER REFERENCES modules(id)`);
                console.log(`✅ Added module_id to ${table}`);
            } else {
                console.log(`ℹ️ ${table} already has module_id`);
            }
        }
    } catch (error) {
        console.error("Migration failed:", error);
    }
};

migrate();
