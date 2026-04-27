import { db } from './db.js';

async function migrate() {
    console.log('Creating youtube_tokens table...');
    await db.execute(`
        CREATE TABLE IF NOT EXISTS youtube_tokens (
            id INTEGER PRIMARY KEY DEFAULT 1,
            access_token TEXT,
            refresh_token TEXT,
            expiry_date INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('Creating imported_playlists table...');
    await db.execute(`
        CREATE TABLE IF NOT EXISTS imported_playlists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            playlist_id TEXT UNIQUE NOT NULL,
            playlist_title TEXT,
            imported_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('Migration complete.');
    process.exit(0);
}

migrate().catch(e => { console.error(e); process.exit(1); });
