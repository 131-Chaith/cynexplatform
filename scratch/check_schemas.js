import { db } from '../server/db.js';

async function check() {
    try {
        const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('Tables:', tables.rows.map(r => r.name));

        for (const table of tables.rows) {
            console.log(`\nSchema for ${table.name}:`);
            const schema = await db.execute(`PRAGMA table_info(${table.name})`);
            console.table(schema.rows);
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

check();
