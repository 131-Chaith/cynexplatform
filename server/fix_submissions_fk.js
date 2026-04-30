import { db } from './db.js';

async function fixSubmissionsTable() {
    try {
        console.log("Starting migration to fix submissions table foreign key...");

        // 1. Create a temporary table with the correct schema
        await db.execute(`
            CREATE TABLE submissions_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                assignment_id INTEGER,
                student_id INTEGER,
                submission_link TEXT,
                grade TEXT,
                status TEXT DEFAULT 'submitted',
                submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(assignment_id) REFERENCES assignments(id),
                FOREIGN KEY(student_id) REFERENCES users(id)
            )
        `);
        console.log("Created submissions_new table.");

        // 2. Copy data from old table to new table
        await db.execute(`
            INSERT INTO submissions_new (id, assignment_id, student_id, submission_link, grade, status, submitted_at)
            SELECT id, assignment_id, student_id, submission_link, grade, status, submitted_at FROM submissions
        `);
        console.log("Copied data to submissions_new.");

        // 3. Drop the old table
        await db.execute("DROP TABLE submissions");
        console.log("Dropped old submissions table.");

        // 4. Rename the new table to the original name
        await db.execute("ALTER TABLE submissions_new RENAME TO submissions");
        console.log("Renamed submissions_new to submissions.");

        console.log("Migration completed successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
    }
}

fixSubmissionsTable();
