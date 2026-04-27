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

const debugInsert = async () => {
    try {
        console.log("Attempting to insert mock test with ONLY module_id...");

        // 1. Get a valid module ID
        const modRes = await db.execute("SELECT id, title FROM modules LIMIT 1");
        if (modRes.rows.length === 0) {
            console.error("No modules found!");
            return;
        }
        const moduleId = modRes.rows[0].id;
        console.log(`Using Module ID: ${moduleId} (${modRes.rows[0].title})`);

        // 2. Attempt Insert
        try {
            await db.execute({
                sql: "INSERT INTO mock_tests (module_id, title, duration, total_marks, type, questions) VALUES (?, ?, ?, ?, ?, ?)",
                args: [moduleId, "Debug Test", 10, 10, "MCQ", JSON.stringify([])]
            });
            console.log("✅ Insert Successful!");
        } catch (e) {
            console.error("❌ Insert Failed:", e);
            console.error("Error Message:", e.message);
            console.error("Error Code:", e.code);
        }

    } catch (error) {
        console.error("Script Error:", error);
    }
};

debugInsert();
