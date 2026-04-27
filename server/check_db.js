import { db } from './db.js';
async function run() {
    try {
        const res = await db.execute("SELECT id, email, role, password FROM users");
        const admin = res.rows.find(r => r.email === 'admin@cynex.ai');
        console.log("Admin user:", admin);
    } catch (e) {
        console.error(e);
    }
}
run();
