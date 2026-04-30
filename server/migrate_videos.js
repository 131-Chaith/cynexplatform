import { db } from './db.js';

const createVideosTable = async () => {
    try {
        console.log("Creating videos table...");
        await db.execute(`
            CREATE TABLE IF NOT EXISTS videos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                youtube_url TEXT NOT NULL,
                course_id INTEGER,
                module_id INTEGER,
                duration TEXT,
                order_index INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES courses(id),
                FOREIGN KEY (module_id) REFERENCES modules(id)
            )
        `);
        console.log("Videos table created successfully.");
    } catch (error) {
        console.error("Failed to create videos table:", error);
    }
};

createVideosTable();
