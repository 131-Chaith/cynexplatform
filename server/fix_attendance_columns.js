import { db } from './db.js';

const fixAttendanceSessions = async () => {
    try {
        console.log("Fixing attendance_sessions table...");
        
        const tableInfo = await db.execute("PRAGMA table_info(attendance_sessions)");
        const columns = tableInfo.rows.map(r => r.name);
        
        if (!columns.includes('threshold_percentage')) {
            await db.execute("ALTER TABLE attendance_sessions ADD COLUMN threshold_percentage INTEGER DEFAULT 75");
            console.log("Added column: threshold_percentage");
        }
        
        if (!columns.includes('duration_mins')) {
            await db.execute("ALTER TABLE attendance_sessions ADD COLUMN duration_mins INTEGER DEFAULT 60");
            console.log("Added column: duration_mins");
        }

        console.log("Database updated successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Update failed:", error);
        process.exit(1);
    }
};

fixAttendanceSessions();
