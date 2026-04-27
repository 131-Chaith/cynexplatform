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

const fixSchema = async () => {
    try {
        console.log("Starting schema fix for enrollments...");

        // 1. Rename existing table
        console.log("Renaming enrollments to enrollments_temp...");
        await db.execute("ALTER TABLE enrollments RENAME TO enrollments_temp");

        // 2. Create new table with correct FK
        console.log("Creating new enrollments table...");
        await db.execute(`
            CREATE TABLE enrollments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                course_id INTEGER NOT NULL,
                enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                UNIQUE(student_id, course_id)
            )
        `);

        // 3. Copy data
        console.log("Copying data...");
        await db.execute(`
            INSERT INTO enrollments (id, student_id, course_id, enrolled_at)
            SELECT id, student_id, course_id, enrolled_at FROM enrollments_temp
        `);

        // 4. Drop old table
        console.log("Dropping enrollments_temp...");
        await db.execute("DROP TABLE enrollments_temp");

        console.log("Schema fix completed successfully!");

        // Verify
        const schema = await db.execute("SELECT sql FROM sqlite_master WHERE name='enrollments'");
        console.log("New Schema:", schema.rows[0]?.sql);

    } catch (error) {
        console.error("Error fixing schema:", error);
        // Attempt rollback if renamed but not created? (Manual intervention might be safer)
    }
};

fixSchema();
