import { createClient } from "@libsql/client";

const db = createClient({
    url: "file:server/local.db"
});

async function check() {
    try {
        const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('Tables:', tables.rows.map(r => r.name));

        const targetTables = ['batches', 'attendance_sessions'];
        for (const table of targetTables) {
            console.log(`\nData for ${table}:`);
            try {
                const data = await db.execute(`SELECT * FROM ${table}`);
                console.table(data.rows);
            } catch (e) {
                console.log(`Error checking ${table}: ${e.message}`);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

check();
