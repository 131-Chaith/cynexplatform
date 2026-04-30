import { db } from './db.js';

const migrateV6 = async () => {
    try {
        console.log("Starting Attendance Schema Consistency Migration (v6)...");

        // 1. Add duration_mins to attendance_records
        const recordInfo = await db.execute("PRAGMA table_info(attendance_records)");
        const recordCols = recordInfo.rows.map(r => r.name);

        if (!recordCols.includes('duration_mins')) {
            await db.execute("ALTER TABLE attendance_records ADD COLUMN duration_mins INTEGER DEFAULT 0");
            console.log("✅ Added duration_mins to attendance_records");
            
            // Sync existing duration data if any
            if (recordCols.includes('duration')) {
                await db.execute("UPDATE attendance_records SET duration_mins = duration WHERE duration IS NOT NULL");
                console.log("✅ Synced duration -> duration_mins");
            }
        }

        console.log("🚀 Migration V6 Complete!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration V6 failed:", error);
        process.exit(1);
    }
};

migrateV6();
