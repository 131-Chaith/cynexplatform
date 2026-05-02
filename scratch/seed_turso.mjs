/**
 * seed_turso.mjs
 * Run this AFTER creating a new Turso database to populate it with:
 *  - Full schema (all tables)
 *  - All users, courses, batches, students, enrollments from local.db
 * 
 * Usage:
 *   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... node scratch/seed_turso.mjs
 */

import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localDb = createClient({ url: `file:${path.join(__dirname, '../server/local.db')}` });

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('❌ Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN env vars first!');
  console.error('   Example: TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... node scratch/seed_turso.mjs');
  process.exit(1);
}

const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

console.log('🔗 Connected to Turso:', TURSO_URL);

// ─── 1. CREATE SCHEMA ────────────────────────────────────────────────────────
console.log('\n📐 Creating schema...');

const schema = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'student',
    batch_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    duration TEXT,
    thumbnail TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    start_date DATETIME,
    end_date DATETIME
  )`,
  `CREATE TABLE IF NOT EXISTS batch_courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    FOREIGN KEY (batch_id) REFERENCES batches(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  )`,
  `CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    phone TEXT,
    dob DATE,
    address TEXT,
    gender TEXT,
    guardian_name TEXT,
    guardian_contact TEXT,
    previous_qualification TEXT,
    batch_id INTEGER,
    profile_photo TEXT,
    resume_link TEXT,
    skills TEXT,
    institution TEXT,
    highest_qualification TEXT,
    year_of_passing TEXT,
    experience TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (batch_id) REFERENCES batches(id)
  )`,
  `CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  )`,
  `CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER,
    title TEXT,
    date TEXT,
    time TEXT,
    duration TEXT,
    meet_link TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER,
    title TEXT,
    description TEXT,
    due_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER,
    student_id INTEGER,
    content TEXT,
    file_url TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    grade TEXT,
    feedback TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    title TEXT,
    description TEXT,
    github_url TEXT,
    demo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS mock_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER,
    title TEXT,
    description TEXT,
    questions TEXT,
    time_limit INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS test_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER,
    student_id INTEGER,
    score INTEGER,
    answers TEXT,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS certificate_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    course_id INTEGER,
    status TEXT DEFAULT 'pending',
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    course_id INTEGER,
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    certificate_url TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS attendance_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER,
    batch_id INTEGER,
    session_date TEXT,
    session_name TEXT,
    qr_token TEXT UNIQUE,
    qr_expires_at DATETIME,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    meet_link TEXT,
    is_online INTEGER DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS attendance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER,
    student_id INTEGER,
    marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'present',
    FOREIGN KEY (session_id) REFERENCES attendance_sessions(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
  )`,
  `CREATE TABLE IF NOT EXISTS qr_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER,
    qr_code TEXT,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS qr_scan_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    qr_session_id INTEGER,
    student_id INTEGER,
    scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS qr_attendance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER,
    student_id INTEGER,
    marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    method TEXT DEFAULT 'qr'
  )`,
  `CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER,
    module_id INTEGER,
    title TEXT,
    description TEXT,
    youtube_url TEXT,
    video_id TEXT,
    duration TEXT,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    batch_id INTEGER,
    course_id INTEGER,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    message TEXT,
    type TEXT DEFAULT 'info',
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS course_modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER,
    module_id INTEGER,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (module_id) REFERENCES modules(id)
  )`,
  `CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER,
    title TEXT,
    description TEXT,
    exam_date TEXT,
    duration INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
];

for (const sql of schema) {
  await turso.execute(sql);
}
console.log('✅ Schema created.');

// ─── 2. SEED DATA FROM LOCAL.DB ──────────────────────────────────────────────
async function copyTable(table, columns, localSql, tursoSql, transform) {
  const rows = await localDb.execute(localSql);
  let count = 0;
  for (const row of rows.rows) {
    const vals = transform ? transform(row) : columns.map(c => row[c]);
    try {
      await turso.execute({ sql: tursoSql, args: vals });
      count++;
    } catch (e) {
      if (!e.message.includes('UNIQUE constraint')) {
        console.warn(`  ⚠️  ${table} row error: ${e.message}`);
      }
    }
  }
  console.log(`  ✅ ${table}: ${count} rows`);
}

console.log('\n📦 Seeding data...');

await copyTable('users', ['id','name','email','password','role','batch_id'],
  'SELECT id, name, email, password, role, batch_id FROM users',
  'INSERT OR IGNORE INTO users (id, name, email, password, role, batch_id) VALUES (?, ?, ?, ?, ?, ?)',
  r => [r.id, r.name, r.email, r.password, r.role, r.batch_id]
);

await copyTable('courses', ['id','title','description','duration','thumbnail'],
  'SELECT id, title, description, duration, thumbnail FROM courses',
  'INSERT OR IGNORE INTO courses (id, title, description, duration, thumbnail) VALUES (?, ?, ?, ?, ?)',
  r => [r.id, r.title, r.description, r.duration, r.thumbnail]
);

await copyTable('batches', ['id','batch_name','start_date','end_date'],
  'SELECT id, batch_name, start_date, end_date FROM batches',
  'INSERT OR IGNORE INTO batches (id, batch_name, start_date, end_date) VALUES (?, ?, ?, ?)',
  r => [r.id, r.batch_name, r.start_date, r.end_date]
);

await copyTable('batch_courses', ['id','batch_id','course_id'],
  'SELECT id, batch_id, course_id FROM batch_courses',
  'INSERT OR IGNORE INTO batch_courses (id, batch_id, course_id) VALUES (?, ?, ?)',
  r => [r.id, r.batch_id, r.course_id]
);

await copyTable('students', ['id','user_id','phone','dob','address','gender','batch_id','profile_photo','skills','institution','highest_qualification','year_of_passing','experience'],
  'SELECT id, user_id, phone, dob, address, gender, batch_id, profile_photo, skills, institution, highest_qualification, year_of_passing, experience FROM students',
  'INSERT OR IGNORE INTO students (id, user_id, phone, dob, address, gender, batch_id, profile_photo, skills, institution, highest_qualification, year_of_passing, experience) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  r => [r.id, r.user_id, r.phone, r.dob, r.address, r.gender, r.batch_id, r.profile_photo, r.skills, r.institution, r.highest_qualification, r.year_of_passing, r.experience]
);

await copyTable('enrollments', ['id','student_id','course_id'],
  'SELECT id, student_id, course_id FROM enrollments',
  'INSERT OR IGNORE INTO enrollments (id, student_id, course_id) VALUES (?, ?, ?)',
  r => [r.id, r.student_id, r.course_id]
);

await copyTable('announcements', [],
  'SELECT id, title, content, batch_id, course_id, created_by FROM announcements',
  'INSERT OR IGNORE INTO announcements (id, title, content, batch_id, course_id, created_by) VALUES (?, ?, ?, ?, ?, ?)',
  r => [r.id, r.title, r.content, r.batch_id, r.course_id, r.created_by]
);

localDb.close();
turso.close();

console.log('\n🎉 Turso DB seeded successfully!');
console.log('   Update server/.env with:');
console.log(`   TURSO_DATABASE_URL=${TURSO_URL}`);
console.log(`   TURSO_AUTH_TOKEN=${TURSO_TOKEN}`);
