import { db } from './db.js';

const upgradeEnterpriseSchema = async () => {
    try {
        console.log("Upgrading to Enterprise Attendance Schema...");

        // 1. Create secure scan logs table for auditing
        await db.execute(`
            CREATE TABLE IF NOT EXISTS qr_scan_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                session_id INTEGER NOT NULL,
                scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                ip_address TEXT,
                device_info TEXT,
                gps_latitude REAL,
                gps_longitude REAL,
                validation_status TEXT,
                FOREIGN KEY (student_id) REFERENCES users(id),
                FOREIGN KEY (session_id) REFERENCES attendance_sessions(id)
            )
        `);

        // 2. Add security fields to attendance_sessions
        const securityCols = [
            { name: 'qr_rotation_enabled', type: 'INTEGER DEFAULT 1' },
            { name: 'gps_enabled', type: 'INTEGER DEFAULT 0' },
            { name: 'campus_radius', type: 'INTEGER DEFAULT 150' },
            { name: 'attendance_window_mins', type: 'INTEGER DEFAULT 10' }
        ];

        for (const col of securityCols) {
            try {
                await db.execute(`ALTER TABLE attendance_sessions ADD COLUMN ${col.name} ${col.type}`);
            } catch (e) {
                // Column exists
            }
        }

        console.log("Enterprise schema ready!");
    } catch (error) {
        console.error("Enterprise upgrade failed:", error);
    }
};

upgradeEnterpriseSchema();
