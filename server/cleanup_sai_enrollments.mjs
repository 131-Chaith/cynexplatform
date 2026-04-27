import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function cleanup() {
    try {
        const studentId = 2; // Sai
        console.log("Cleaning up enrollments for student ID 2 (Sai)...");

        const result = await db.execute({
            sql: "DELETE FROM enrollments WHERE student_id = ?",
            args: [studentId]
        });

        console.log(`Successfully removed ${result.rowsAffected} enrollment(s).`);
    } catch (e) {
        console.error("Cleanup failed:", e);
    }
}

cleanup();
