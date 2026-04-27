import { db } from './db.js';
import fs from 'fs';
async function main() {
    const data = {
        enrollments: (await db.execute('SELECT * FROM enrollments')).rows,
        batch_courses: (await db.execute('SELECT * FROM batch_courses')).rows,
        users: (await db.execute('SELECT id, name, batch_id FROM users')).rows,
        students: (await db.execute('SELECT user_id, batch_id FROM students')).rows
    };
    fs.writeFileSync('db_dump.json', JSON.stringify(data, null, 2));
}
main();
