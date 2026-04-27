import { db } from './db.js';

const migrate = async () => {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS modules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                course_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                order_index INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `);
        console.log("Modules table created successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
    }
};

migrate();
