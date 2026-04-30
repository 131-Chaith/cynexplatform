import { db } from './db.js';

const migrateV5 = async () => {
    try {
        console.log("Starting Attendance Pro Migration (v5)...");

        // 1. Create google_tokens table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS google_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE,
                access_token TEXT,
                refresh_token TEXT,
                expiry_date INTEGER,
                scope TEXT,
                token_type TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);
        console.log("✅ google_tokens table ready");

        // 2. Update attendance_sessions columns
        const sessionCols = [
            { name: 'google_event_id', type: 'TEXT' },
            { name: 'calendar_id', type: 'TEXT' },
            { name: 'qr_rotation_enabled', type: 'INTEGER DEFAULT 1' },
            { name: 'gps_enabled', type: 'INTEGER DEFAULT 0' },
            { name: 'campus_radius', type: 'INTEGER DEFAULT 150' },
            { name: 'attendance_window_mins', type: 'INTEGER DEFAULT 10' }
        ];

        const sessionInfo = await db.execute("PRAGMA table_info(attendance_sessions)");
        const sessionExistingCols = sessionInfo.rows.map(r => r.name);

        for (const col of sessionCols) {
            if (!sessionExistingCols.includes(col.name)) {
                await db.execute(`ALTER TABLE attendance_sessions ADD COLUMN ${col.name} ${col.type}`);
                console.log(`✅ Added to attendance_sessions: ${col.name}`);
            }
        }

        // 3. Update attendance_records columns
        const recordCols = [
            { name: 'late_flag', type: 'INTEGER DEFAULT 0' },
            { name: 'attendance_percentage', type: 'INTEGER DEFAULT 0' },
            { name: 'remarks', type: 'TEXT' },
            { name: 'overridden_by', type: 'INTEGER' },
            { name: 'overridden_at', type: 'DATETIME' },
            { name: 'attendance_type', type: 'TEXT' },
            { name: 'participant_id', type: 'TEXT' }
        ];

        const recordInfo = await db.execute("PRAGMA table_info(attendance_records)");
        const recordExistingCols = recordInfo.rows.map(r => r.name);

        for (const col of recordCols) {
            if (!recordExistingCols.includes(col.name)) {
                await db.execute(`ALTER TABLE attendance_records ADD COLUMN ${col.name} ${col.type}`);
                console.log(`✅ Added to attendance_records: ${col.name}`);
            }
        }

        // 4. Update batches to include years if missing
        try {
            await db.execute("ALTER TABLE batches ADD COLUMN year INTEGER DEFAULT 2024");
            console.log("✅ Added year to batches");
        } catch (e) {}

        console.log("🚀 Attendance Pro Migration Complete!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
};

migrateV5();
