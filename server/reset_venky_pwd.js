import { createClient } from "@libsql/client";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// .env is in current dir (server/)
dotenv.config({ path: path.join(__dirname, '.env') });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const resetPassword = async () => {
    try {
        const newPassword = "password123";
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        console.log(`Resetting Venky's password to '${newPassword}'...`);

        await db.execute({
            sql: "UPDATE users SET password = ? WHERE email = 'venky@gmail.com'",
            args: [hashedPassword]
        });

        console.log("Password updated successfully.");

    } catch (error) {
        console.error("Error:", error);
    }
};

resetPassword();
