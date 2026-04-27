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

const verifyFix = async () => {
    try {
        let output = "--- ENROLLMENTS SCHEMA AFTER FIX ---\n";
        const schema = await db.execute("SELECT sql FROM sqlite_master WHERE name='enrollments'");
        output += schema.rows[0]?.sql + "\n";

        fs.writeFileSync('verification_output.txt', output);
        console.log("Written to verification_output.txt");

    } catch (error) {
        console.error("Error:", error);
    }
};

verifyFix();
