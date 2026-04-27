const { createClient } = require('@libsql/client');
const db = createClient({ url: 'file:local.db' });
async function check() {
    try {
        const r = await db.execute("PRAGMA table_info(submissions)");
        console.log("Table info for submissions:");
        console.log(JSON.stringify(r.rows, null, 2));
    } catch (err) {
        console.error("DB error:", err);
    }
}
check();
