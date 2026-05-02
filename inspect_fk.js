import { createClient } from "@libsql/client";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = createClient({ url: `file:${path.join(__dirname, 'server/local.db')}` });

async function check() {
    const res = await db.execute("PRAGMA foreign_key_list(courses)");
    console.log(JSON.stringify(res.rows, null, 2));
}
check();
