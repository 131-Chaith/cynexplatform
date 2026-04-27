import 'dotenv/config';
import { db } from './db.js';

const addAttendanceTable = async () => {
    try {
        console.log("Adding attendance and updating classes table...");

        // 1. Update Classes Table (Add module_id, topic, instructor_name)
        // Check if columns already exist first (for idempotency)
        const tableInfo = await db.execute("PRAGMA table_info(classes)");
        const columns = tableInfo.rows.map(r => r.name);

        if (!columns.includes('module_id')) {
            await db.execute("ALTER TABLE classes ADD COLUMN module_id INTEGER REFERENCES modules(id)");
            console.log("Added 'module_id' to 'classes' table.");
        }
        if (!columns.includes('topic')) {
            await db.execute("ALTER TABLE classes ADD COLUMN topic TEXT");
            console.log("Added 'topic' to 'classes' table.");
        }
        if (!columns.includes('instructor_name')) {
            await db.execute("ALTER TABLE classes ADD COLUMN instructor_name TEXT");
            console.log("Added 'instructor_name' to 'classes' table.");
        }

        // 2. Create Attendance Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                class_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                status TEXT CHECK(status IN ('Present', 'Absent', 'Pending')) DEFAULT 'Pending',
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE,
                FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(class_id, student_id)
            )
        `);
        console.log("Created 'attendance' table.");

        console.log("Migration completed successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
    }
};

addAttendanceTable();
