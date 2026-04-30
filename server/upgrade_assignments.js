import { db } from './db.js';

const fixAssignmentsTable = async () => {
    try {
        console.log("Upgrading Assignments table schema...");
        
        // 1. Rename old table to backup
        await db.execute("ALTER TABLE assignments RENAME TO assignments_old");

        // 2. Create new table with correct columns
        await db.execute(`
            CREATE TABLE assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                module_id INTEGER,
                course_id INTEGER, -- Keep for compatibility if needed
                title TEXT NOT NULL,
                description TEXT,
                due_date DATETIME,
                type TEXT DEFAULT 'standard',
                problem_statement TEXT,
                starter_code TEXT,
                expected_output TEXT,
                difficulty TEXT DEFAULT 'Easy',
                test_cases TEXT DEFAULT '[]',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(module_id) REFERENCES modules(id),
                FOREIGN KEY(course_id) REFERENCES courses(id)
            )
        `);

        // 3. Migrate data if any (mapping course_id to module_id where possible, or just keeping it)
        await db.execute(`
            INSERT INTO assignments (id, title, description, due_date, course_id)
            SELECT id, title, description, due_date, course_id FROM assignments_old
        `);

        // 4. Drop old table
        await db.execute("DROP TABLE assignments_old");

        console.log("Assignments table upgraded successfully.");
    } catch (e) {
        console.error("Migration failed:", e);
    }
};

fixAssignmentsTable();
