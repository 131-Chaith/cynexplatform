import { db } from './db.js';

const migrate = async () => {
    try {
        console.log("Creating enrollments table...");
        await db.execute(`
            CREATE TABLE IF NOT EXISTS enrollments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER,
                course_id INTEGER,
                enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(student_id) REFERENCES users(id),
                FOREIGN KEY(course_id) REFERENCES courses(id),
                UNIQUE(student_id, course_id)
            )
        `);
        console.log("Enrollments table created successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
    }
};

migrate();
