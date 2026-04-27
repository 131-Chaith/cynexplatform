import { db } from './db.js';
async function run() {
    const r = await db.execute("SELECT * FROM users WHERE email = 'student@gmail.com'");
    console.log(r.rows);
}
run();
