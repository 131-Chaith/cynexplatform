import { db } from './server/db.js';
import fs from 'fs';
async function check() {
    const res = await db.execute("PRAGMA table_info(attendance)");
    fs.writeFileSync('schema_output.json', JSON.stringify(res.rows, null, 2));
    process.exit();
}
check();
