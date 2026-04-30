import { db } from './db.js';

const createEnrollmentsTable = async () => {
    try {
        console.log("Creating enrollments table...");
        await db.execute(`
            CREATE TABLE IF NOT EXISTS enrollments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                course_id INTEGER NOT NULL,
                enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                UNIQUE(student_id, course_id)
            )
        `);
        console.log("Table created successfully!");
    } catch (error) {
        console.error("Error creating table:", error);
    }
};

createEnrollmentsTable();
