import { db } from './db.js';
async function main() {
    await db.execute('UPDATE users SET batch_id = NULL WHERE id = 5');
    console.log('Fixed stuck batch_id for Sasasasai');
}
main();
