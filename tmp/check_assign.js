const { createClient } = require('@libsql/client');
const db = createClient({ url: 'file:local.db' });
async function check() {
    try {
        const r = await db.execute("SELECT * FROM assignments LIMIT 1");
        console.log("Sample assignment row:");
        console.log(JSON.stringify(r.rows[0], null, 2));
    } catch (err) {
        console.error("DB error:", err);
    }
}
check();
