import { db } from './db.js';

const setupAnnouncements = async () => {
    try {
        console.log("Setting up Announcements table...");
        
        await db.execute(`
            CREATE TABLE IF NOT EXISTS announcements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                target_type TEXT CHECK(target_type IN ('all', 'batch', 'individual')) NOT NULL,
                target_id INTEGER, -- batch_id or user_id depending on target_type
                status TEXT CHECK(status IN ('draft', 'published', 'scheduled')) DEFAULT 'published',
                publish_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(created_by) REFERENCES users(id)
            )
        `);

        // Add audit_logs table if not exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT,
                module TEXT,
                details TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        `);

        console.log("Announcements and Audit Logs tables ready.");
    } catch (e) {
        console.error("Error setting up announcements table:", e);
    }
};

setupAnnouncements();
