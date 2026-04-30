import { db } from './db.js';

const addNotificationsTable = async () => {
    try {
        console.log("Adding notifications table...");
        
        await db.execute(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                title TEXT,
                message TEXT,
                type TEXT DEFAULT 'info',
                is_read BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Also add admin_feedback to certificate_requests
        const tableInfo = await db.execute("PRAGMA table_info(certificate_requests)");
        const columns = tableInfo.rows.map(r => r.name);
        if (!columns.includes('admin_feedback')) {
            await db.execute("ALTER TABLE certificate_requests ADD COLUMN admin_feedback TEXT");
        }

        console.log("Database updated successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Update failed:", error);
        process.exit(1);
    }
};

addNotificationsTable();
