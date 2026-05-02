import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = createClient({ url: `file:${path.join(__dirname, '../server/local.db')}` });

// Get schema for key tables
const tbls = ['batches', 'courses', 'students', 'enrollments'];
for (const t of tbls) {
  const info = await db.execute(`PRAGMA table_info(${t})`);
  console.log(`\n=== ${t.toUpperCase()} COLUMNS ===`);
  console.log(info.rows.map(r => `${r.name} (${r.type})`).join(', '));
}

// Count rows
const counts = ['users','courses','batches','students','enrollments','attendance_sessions','attendance_records'];
console.log('\n=== ROW COUNTS ===');
for (const t of counts) {
  const r = await db.execute(`SELECT COUNT(*) as c FROM ${t}`);
  console.log(`  ${t}: ${r.rows[0].c}`);
}

db.close();
