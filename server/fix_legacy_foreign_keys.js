import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config({ path: "server/.env" });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
    try {
        console.log("🚀 Starting Major Schema Repair...");

        const tablesToFix = [
            {
                name: "students",
                sql: `CREATE TABLE students (
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
                )`
            },
            {
                name: "submissions",
                sql: `CREATE TABLE submissions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    assignment_id INTEGER,
                    student_id INTEGER,
                    submission_link TEXT,
                    grade TEXT,
                    status TEXT DEFAULT 'submitted',
                    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(assignment_id) REFERENCES assignments(id),
                    FOREIGN KEY(student_id) REFERENCES users(id)
                )`
            },
            {
                name: "projects",
                sql: `CREATE TABLE projects (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id INTEGER,
                    course_id INTEGER,
                    title TEXT,
                    repo_link TEXT,
                    status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
                    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(student_id) REFERENCES users(id),
                    FOREIGN KEY(course_id) REFERENCES courses(id)
                )`
            },
            {
                name: "test_results",
                sql: `CREATE TABLE test_results (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    test_id INTEGER,
                    student_id INTEGER,
                    score INTEGER,
                    total_questions INTEGER,
                    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(test_id) REFERENCES mock_tests(id),
                    FOREIGN KEY(student_id) REFERENCES users(id)
                )`
            },
            {
                name: "certificate_requests",
                sql: `CREATE TABLE certificate_requests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id INTEGER,
                    course_id INTEGER,
                    video_link TEXT,
                    status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
                    request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(student_id) REFERENCES users(id),
                    FOREIGN KEY(course_id) REFERENCES courses(id)
                )`
            },
            {
                name: "certificates",
                sql: `CREATE TABLE certificates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id INTEGER,
                    course_id INTEGER,
                    issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(student_id) REFERENCES users(id),
                    FOREIGN KEY(course_id) REFERENCES courses(id)
                )`
            },
            {
                name: "activity_logs",
                sql: `CREATE TABLE activity_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    action TEXT,
                    module TEXT,
                    details TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )`
            }
        ];

        for (const table of tablesToFix) {
            console.log(`\n📦 Migrating table: ${table.name}`);

            // 1. Rename to backup
            console.log(`  - Renaming ${table.name} to ${table.name}_backup...`);
            await db.execute(`ALTER TABLE ${table.name} RENAME TO ${table.name}_backup`);

            // 2. Create new table with correct FK
            console.log(`  - Creating new ${table.name} table...`);
            await db.execute(table.sql);

            // 3. Copy data
            console.log(`  - Copying data...`);
            const columnsResult = await db.execute(`PRAGMA table_info(${table.name}_backup)`);
            const columns = columnsResult.rows.map(r => r.name).join(', ');
            await db.execute(`INSERT INTO ${table.name} (${columns}) SELECT ${columns} FROM ${table.name}_backup`);

            // 4. Drop backup
            console.log(`  - Dropping backup...`);
            await db.execute(`DROP TABLE ${table.name}_backup`);

            console.log(`✅ Table ${table.name} migrated successfully.`);
        }

        console.log("\n🎊 All tables repaired successfully!");

    } catch (error) {
        console.error("\n❌ Migration failed!");
        console.error(error.message);
        if (error.cause) console.error("Cause:", error.cause.message);
    }
}

migrate();
