import { db } from './db.js';

const upgradeSchema = async () => {
    try {
        console.log("Upgrading Attendance Schema...");

        // 1. Update attendance_sessions with advanced fields
        // SQLite doesn't support multiple ADD COLUMN in one statement easily, so we run them sequentially
        const columns = [
            { name: 'threshold_percentage', type: 'INTEGER DEFAULT 75' },
            { name: 'google_event_id', type: 'TEXT' },
            { name: 'meeting_code', type: 'TEXT' },
            { name: 'qr_expiry', type: 'DATETIME' },
            { name: 'duration_mins', type: 'INTEGER DEFAULT 60' },
            { name: 'session_name', type: 'TEXT' }
        ];

        for (const col of columns) {
            try {
                await db.execute(`ALTER TABLE attendance_sessions ADD COLUMN ${col.name} ${col.type}`);
            } catch (e) {
                // Ignore if column already exists
            }
        }

        // 2. Create qr_sessions table for dynamic token tracking
        await db.execute(`
            CREATE TABLE IF NOT EXISTS qr_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                qr_token TEXT NOT NULL,
                expiry_time DATETIME NOT NULL,
                active_status INTEGER DEFAULT 1,
                FOREIGN KEY (session_id) REFERENCES attendance_sessions(id)
            )
        `);

        // 3. Update attendance_records for detailed tracking
        const recordCols = [
            { name: 'leave_time', type: 'DATETIME' },
            { name: 'duration_seconds', type: 'INTEGER DEFAULT 0' },
            { name: 'late_flag', type: 'INTEGER DEFAULT 0' },
            { name: 'remarks', type: 'TEXT' },
            { name: 'device_info', type: 'TEXT' },
            { name: 'ip_address', type: 'TEXT' }
        ];

        for (const col of recordCols) {
            try {
                await db.execute(`ALTER TABLE attendance_records ADD COLUMN ${col.name} ${col.type}`);
            } catch (e) {
                // Ignore
            }
        }

        console.log("Database schema upgraded successfully!");
    } catch (error) {
        console.error("Schema upgrade failed:", error);
    }
};

upgradeSchema();
