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

const checkVenky = async () => {
    try {
        console.log("Checking Venky...");
        const user = await db.execute("SELECT id, name, email, password, role FROM users WHERE email = 'venky@gmail.com'");
        console.table(user.rows);
    } catch (error) {
        console.error("Error:", error);
    }
};

checkVenky();
