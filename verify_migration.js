import { createClient } from "@libsql/client";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'server/.env') });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const verify = async () => {
    try {
        console.log("Verifying migration...");

        // Check users
        const usersCount = await db.execute("SELECT count(*) as c FROM users");
        console.log("Rows in users:", usersCount.rows[0].c);

        // Check users_old
        try {
            const usersOldCount = await db.execute("SELECT count(*) as c FROM users_old");
            console.log("Rows in users_old:", usersOldCount.rows[0].c);
        } catch (e) {
            console.log("users_old does not exist (or error):", e.message);
        }

        // Check schema again just to be sure
        const schemaRes = await db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
        if (schemaRes.rows.length > 0) {
            console.log("Users Schema:", schemaRes.rows[0].sql);
        }

    } catch (error) {
        console.error("Verification failed:", error);
    }
};

verify();
