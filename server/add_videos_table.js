import { db } from './db.js';

const addVideosTable = async () => {
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
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL
            )
        `);

        console.log("✅ Videos table created successfully!");

        // Verify table structure
        const tableInfo = await db.execute("PRAGMA table_info(videos)");
        console.log("\nVideos table columns:");
        tableInfo.rows.forEach(col => {
            console.log(`  - ${col.name} (${col.type})`);
        });

    } catch (error) {
        console.error("❌ Error creating videos table:", error);
    }
};

addVideosTable();
