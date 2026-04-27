
import { db } from './db.js';
import bcrypt from 'bcryptjs';

async function testPassword() {
    const res = await db.execute("SELECT password FROM users WHERE email = 'admin@gmail.com'");
    const hash = res.rows[0].password;
    console.log("Hash in DB:", hash);
    const isMatch = await bcrypt.compare('admin123', hash);
    console.log("Matching 'admin123'?", isMatch);
    
    // Also check student
    const sRes = await db.execute("SELECT password FROM users WHERE email = 'student@gmail.com'");
    const sHash = sRes.rows[0].password;
    const sMatch = await bcrypt.compare('student123', sHash);
    console.log("Matching 'student123'?", sMatch);
}
testPassword();
