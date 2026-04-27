import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();
const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    const res = await db.execute("PRAGMA table_info(students)");
    fs.writeFileSync("students_cols.json", JSON.stringify(res.rows, null, 2));
}
run();
