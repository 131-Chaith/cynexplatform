import { createClient } from "@libsql/client";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = createClient({ url: `file:${path.join(__dirname, 'server/local.db')}` });

async function check() {
    const tablesRes = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
    for (const table of tablesRes.rows) {
        const res = await db.execute(`PRAGMA foreign_key_list(${table.name})`);
        if (res.rows.length > 0) {
            console.log(`Table: ${table.name}`);
            console.log(JSON.stringify(res.rows, null, 2));
        }
    }
}
check();
