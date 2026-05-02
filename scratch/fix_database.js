import { db } from '../server/db.js';

async function fixDatabase() {
    try {
        console.log("🛠 Fixing database: Creating missing tables...");
        
        // 1. Announcements
        await db.execute(`
            CREATE TABLE IF NOT EXISTS announcements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                target_type TEXT DEFAULT 'all',
                target_id TEXT,
                status TEXT DEFAULT 'published',
                publish_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )
        `);
        console.log("✅ 'announcements' table created.");

        // 2. Notifications
        await db.execute(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                type TEXT DEFAULT 'info',
                is_read INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log("✅ 'notifications' table created.");

        // 3. Audit Logs / Activity Logs
        await db.execute(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT NOT NULL,
                module TEXT,
                details TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);
        console.log("✅ 'audit_logs' table created.");

        console.log("🚀 Database fix complete.");
    } catch (e) {
        console.error("❌ Error fixing database:", e);
    }
}

fixDatabase();
