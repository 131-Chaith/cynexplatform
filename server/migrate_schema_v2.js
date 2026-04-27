import { db } from './db.js';

const migrateSchema = async () => {
    try {
        console.log("Migrating schema to v2...");

        // 1. Batches Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS batches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                batch_name TEXT NOT NULL,
                start_date DATETIME,
                end_date DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Students Table (Extended Profile)
        // Linked to users table via user_id
        await db.execute(`
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE,
                batch_id INTEGER,
                phone TEXT,
                dob DATETIME,
                address TEXT,
                gender TEXT,
                guardian_name TEXT,
                guardian_contact TEXT,
                previous_qualification TEXT,
                admission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                profile_photo TEXT,
                status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(batch_id) REFERENCES batches(id)
            )
        `);

        // 3. Batch Courses (Many-to-Many)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS batch_courses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                batch_id INTEGER,
                course_id INTEGER,
                assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(batch_id) REFERENCES batches(id),
                FOREIGN KEY(course_id) REFERENCES courses(id),
                UNIQUE(batch_id, course_id)
            )
        `);

        // 4. Questions (Normalized for mock tests)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                test_id INTEGER,
                question TEXT,
                option_a TEXT,
                option_b TEXT,
                option_c TEXT,
                option_d TEXT,
                correct_option TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(test_id) REFERENCES mock_tests(id)
            )
        `);

        // 5. Attendance
        await db.execute(`
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER,
                date DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT CHECK(status IN ('present', 'absent', 'late', 'excused')) DEFAULT 'present',
                FOREIGN KEY(student_id) REFERENCES students(id)
            )
        `);

        // 6. Activity Logs
        await db.execute(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT,
                module TEXT,
                details TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        `);

        console.log("Schema v2 migration completed successfully.");

    } catch (error) {
        console.error("Migration failed:", error);
    }
};

migrateSchema();
