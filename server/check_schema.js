import { db } from './db.js';
async function run() {
    const r = await db.execute("PRAGMA table_info(users)");
    console.log(r.rows);
}
run();
