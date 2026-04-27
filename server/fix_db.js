import { db } from './db.js';

const migrate = async () => {
    try {
        console.log("Starting migration...");

        // 1. Create Batches Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS batches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                batch_name TEXT UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Created 'batches' table.");

        // 2. Create Batch Courses Table (Links batches to courses)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS batch_courses (
                batch_id INTEGER,
                course_id INTEGER,
                PRIMARY KEY(batch_id, course_id),
                FOREIGN KEY(batch_id) REFERENCES batches(id) ON DELETE CASCADE,
                FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `);
        console.log("Created 'batch_courses' table.");

        // 3. Add batch_id to Users Table
        const userTableInfo = await db.execute("PRAGMA table_info(users)");
        const userColumns = userTableInfo.rows.map(r => r.name);
        if (!userColumns.includes('batch_id')) {
            await db.execute("ALTER TABLE users ADD COLUMN batch_id INTEGER REFERENCES batches(id)");
            console.log("Added 'batch_id' column to 'users' table.");
        }

        // 4. Create some default data so it's not empty
        await db.execute("INSERT OR IGNORE INTO batches (id, batch_name) VALUES (1, 'March 2024 Batch')");
        await db.execute("UPDATE users SET batch_id = 1 WHERE role = 'student'");
        
        // Link all courses to this batch for testing
        const courses = await db.execute("SELECT id FROM courses");
        for (const course of courses.rows) {
            await db.execute({
                sql: "INSERT OR IGNORE INTO batch_courses (batch_id, course_id) VALUES (1, ?)",
                args: [course.id]
            });
        }

        console.log("Migration completed successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
    }
};

migrate();
