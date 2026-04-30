import { db } from './db.js';

const listTables = async () => {
    try {
        const res = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log("Tables:", res.rows.map(r => r.name));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listTables();
