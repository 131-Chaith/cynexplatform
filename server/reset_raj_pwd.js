import { createClient } from "@libsql/client";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const resetPassword = async () => {
    try {
        const email = "raj@gmail.com";
        const newPassword = "student123";
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        console.log(`Resetting Sasasasai's password (${email}) to '${newPassword}'...`);

        await db.execute({
            sql: "UPDATE users SET password = ? WHERE email = ?",
            args: [hashedPassword, email]
        });

        console.log("Password updated successfully.");

    } catch (error) {
        console.error("Error:", error);
    }
};

resetPassword();
