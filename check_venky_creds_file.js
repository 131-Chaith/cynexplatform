import { createClient } from "@libsql/client";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'server/.env') });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const checkVenky = async () => {
    try {
        let output = "";
        output += "Checking Venky...\n";
        const user = await db.execute("SELECT id, name, email, password, role FROM users WHERE email = 'venky@gmail.com'");
        output += JSON.stringify(user.rows, null, 2);

        fs.writeFileSync('venky_creds_output.txt', output);
        console.log("Written to venky_creds_output.txt");
    } catch (error) {
        console.error("Error:", error);
    }
};

checkVenky();
