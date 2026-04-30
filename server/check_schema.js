import { db } from './db.js';

const check = async () => {
    try {
        const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log("Tables:", tables.rows.map(r => r.name));
        
        for (const table of tables.rows) {
            const info = await db.execute(`PRAGMA table_info(${table.name})`);
            console.log(`Columns in ${table.name}:`, info.rows.map(r => r.name));
        }
    } catch (e) {
        console.error(e);
    }
};

check();
