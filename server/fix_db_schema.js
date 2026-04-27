import 'dotenv/config';
import { db } from './db.js';

const fixSchema = async () => {
    try {
        console.log("Fixing DB Schema...");
        console.log("Database URL present:", !!process.env.TURSO_DATABASE_URL);

        // 1. Create Global Modules Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS modules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Created 'modules' table.");

        // 2. Create Junction Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS course_modules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                course_id INTEGER NOT NULL,
                module_id INTEGER NOT NULL,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
            )
        `);
        console.log("Created 'course_modules' table.");

        // Verify
        const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='modules'");
        if (tables.rows.length > 0) {
            console.log("SUCCESS: 'modules' table exists.");
        } else {
            console.error("FAILURE: 'modules' table still missing.");
        }

    } catch (error) {
        console.error("Schema fix failed:", error);
    }
};

fixSchema();
