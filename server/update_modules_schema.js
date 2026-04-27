import 'dotenv/config';
import { db } from './db.js';

const migrate = async () => {
    try {
        console.log("Starting Migration...");

        // Drop existing tables to reset schema (Dev only approach)
        await db.execute("DROP TABLE IF EXISTS modules");
        await db.execute("DROP TABLE IF EXISTS course_modules");

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

    } catch (error) {
        console.error("Migration failed:", error);
    }
};

migrate();
