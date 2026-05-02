import { db } from '../server/db.js';

async function check() {
    try {
        const res = await db.execute('PRAGMA table_info(certificates)');
        console.log(res.rows);
    } catch (e) {
        console.error(e);
    }
}
check();
