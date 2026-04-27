import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'server', 'local.db');

const db = createClient({
    url: `file:${dbPath}`,
});

async function resetPasswords() {
    try {
        const adminHash = await bcrypt.hash('admin123', 10);
        const studentHash = await bcrypt.hash('student123', 10);

        await db.execute({
            sql: 'UPDATE users SET password = ? WHERE email = ?',
            args: [adminHash, 'admin@gmail.com']
        });
        await db.execute({
            sql: 'UPDATE users SET password = ? WHERE email = ?',
            args: [studentHash, 'student@gmail.com']
        });

        console.log('Passwords reset successfully:');
        console.log('admin@gmail.com -> admin123');
        console.log('student@gmail.com -> student123');
    } catch (e) {
        console.error('Error:', e);
    }
}

resetPasswords();
