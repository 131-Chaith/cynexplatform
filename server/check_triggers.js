import { db } from './db.js';

async function checkSchema() {
    try {
        const res = await db.execute("SELECT name, sql FROM sqlite_master WHERE name = 'certificate_requests'");
        console.log("Certificate Requests schema:");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (error) {
        console.error("Error checking schema:", error);
    }
}

checkSchema();
