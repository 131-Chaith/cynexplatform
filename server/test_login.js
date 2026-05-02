import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = createClient({ url: `file:${path.join(__dirname, 'local.db')}` });

async function testLogin() {
    const email = 'admin@cynex.ai';
    const password = 'password123';
    const JWT_SECRET = 'your-secret-key';

    console.log(`🔍 Testing login for: ${email}`);

    try {
        const result = await db.execute({
            sql: "SELECT * FROM users WHERE email = ?",
            args: [email]
        });

        if (result.rows.length === 0) {
            console.error("❌ User not found in database.");
            return;
        }

        const user = result.rows[0];
        console.log("👤 User found:", { id: user.id, email: user.email, role: user.role });

        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`🔑 Password match: ${isMatch}`);

        if (!isMatch) {
            console.error("❌ Password does not match!");
            return;
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        console.log("✅ Token generated successfully:", token.substring(0, 20) + "...");

    } catch (error) {
        console.error("💥 CRASH during test:", error);
    } finally {
        process.exit();
    }
}

testLogin();
