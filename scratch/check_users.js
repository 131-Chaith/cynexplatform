import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'server', 'local.db');

const db = createClient({
    url: `file:${dbPath}`,
});

async function checkUsers() {
    try {
        const users = await db.execute('SELECT id, email, name, role, batch_id FROM users');
        console.log('Users in DB:');
        console.table(users.rows);
    } catch (e) {
        console.error('Error:', e);
    }
}

checkUsers();
