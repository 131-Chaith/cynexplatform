
import { db } from './db.js';
async function verify() {
    const res = await db.execute("SELECT * FROM users WHERE email = 'admin@gmail.com'");
    console.log("Found Users:", res.rows.length);
    console.log(JSON.stringify(res.rows, null, 2));
}
verify();
