import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../server/local.db');

const db = createClient({ url: `file:${dbPath}` });

const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
console.log('\n=== TABLES ===');
console.log(tables.rows.map(r => r.name).join(', '));

const users = await db.execute('SELECT id, name, email, role, batch_id FROM users ORDER BY id');
console.log('\n=== USERS ===');
console.table(users.rows);

const batches = await db.execute('SELECT id, name, course_id FROM batches LIMIT 5');
console.log('\n=== BATCHES (first 5) ===');
console.table(batches.rows);

const courses = await db.execute('SELECT id, title FROM courses LIMIT 5');
console.log('\n=== COURSES (first 5) ===');
console.table(courses.rows);

db.close();
