import { createClient } from "@libsql/client";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, 'server/.env');

// Manually read .env
if (fs.existsSync(envPath)) {
    console.log("Loading .env from", envPath);
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} else {
    console.log(".env not found at", envPath);
}

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const migrateRoles = async () => {
    try {
        console.log("Migrating users table to support super_admin...");

        // 1. Rename existing table
        await db.execute("ALTER TABLE users RENAME TO users_old");
        console.log("Renamed users to users_old");

        // 2. Create new table with updated CHECK constraint
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                email TEXT UNIQUE,
                password TEXT,
                role TEXT CHECK(role IN ('student', 'admin', 'super_admin')) DEFAULT 'student',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Created new users table");

        // 3. Copy data
        // Explicit columns to avoid issues if schema matches
        await db.execute("INSERT INTO users (id, name, email, password, role, created_at) SELECT id, name, email, password, role, created_at FROM users_old");
        console.log("Copied data from users_old to users");

        // 4. Drop old table
        await db.execute("DROP TABLE users_old");
        console.log("Dropped users_old table");

        console.log("✅ Migration completed successfully!");

    } catch (error) {
        console.error("❌ Migration failed:", error);
    }
};

migrateRoles();
