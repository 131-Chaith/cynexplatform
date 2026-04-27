import { createClient } from "@libsql/client";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Ensure we load env correctly
dotenv.config({ path: path.join(__dirname, 'server/.env') });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const migrateRoles = async () => {
    try {
        console.log("Migrating users table to support super_admin...");

        // Disable Foreign Keys to allow dropping users table
        await db.execute("PRAGMA foreign_keys = OFF");
        console.log("Foreign keys disabled.");

        // Check if users table already supports super_admin
        const schemaRes = await db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
        if (schemaRes.rows.length > 0) {
            const sql = schemaRes.rows[0].sql;
            if (sql.includes('super_admin')) {
                console.log("✅ Users table already checks for super_admin. No migration needed.");
                return;
            }
        }

        // Check if users_old exists
        let usersOldExists = false;
        try {
            const res = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users_old'");
            usersOldExists = res.rows.length > 0;
        } catch (e) {
            console.log("Error checking users_old:", e);
        } // Start of Selection

        if (usersOldExists) {
            console.log("Found users_old table. Resetting partial migration...");
            // Log count in users_old
            const count = await db.execute("SELECT count(*) as c FROM users_old");
            console.log("Rows in users_old:", count.rows[0].c);

            await db.execute("DROP TABLE IF EXISTS users");
            console.log("Dropped users table (if existed).");
        } else {
            console.log("Renaming existing users table...");
            await db.execute("ALTER TABLE users RENAME TO users_old");
        }

        console.log("Creating new users table...");
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

        console.log("Copying data...");
        await db.execute("INSERT INTO users (id, name, email, password, role, created_at) SELECT id, name, email, password, role, created_at FROM users_old");
        console.log("Data copied.");

        console.log("Dropping users_old...");
        await db.execute("DROP TABLE users_old");
        console.log("users_old dropped.");

        // Re-enable Foreign Keys
        await db.execute("PRAGMA foreign_keys = ON");
        console.log("Foreign keys re-enabled.");

        console.log("✅ Migration completed successfully!");

    } catch (error) {
        console.error("❌ Migration failed:", error);
    }
};

migrateRoles();
