import { OAuth2Client } from 'google-auth-library';
import { db } from '../db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const isConfigured = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your_client_id_here.apps.googleusercontent.com';

const oauth2Client = new OAuth2Client(
    GOOGLE_CLIENT_ID || 'dummy_id',
    GOOGLE_CLIENT_SECRET || 'dummy_secret',
    GOOGLE_REDIRECT_URI || 'http://localhost:5173/admin/attendance/google-callback'
);

if (!isConfigured) {
    console.warn("\n[CRITICAL WARNING] Google OAuth is not configured. Google Meet features will NOT work.");
    console.warn("Please update your server/.env file with real credentials from Google Cloud Console.\n");
}

const SCOPES = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/admin.reports.audit.readonly',
    'https://www.googleapis.com/auth/admin.reports.usage.readonly'
];

export const getAuthUrl = () => {
    if (!isConfigured) {
        return 'mocked'; // Signal to frontend to bypass real OAuth
    }
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent'
    });
};

export const saveTokens = async (userId, code) => {
    if (code === 'mock_code_123') {
        await db.execute({
            sql: `INSERT OR REPLACE INTO google_tokens (user_id, access_token, refresh_token, expiry_date, scope, token_type) 
                  VALUES (?, ?, ?, ?, ?, ?)`,
            args: [userId, 'mock_access_token', 'mock_refresh_token', new Date(Date.now() + 10000000).getTime(), 'all', 'Bearer']
        });
        return { access_token: 'mock_access_token' };
    }

    const { tokens } = await oauth2Client.getToken(code);
    
    await db.execute({
        sql: `INSERT OR REPLACE INTO google_tokens (user_id, access_token, refresh_token, expiry_date, scope, token_type) 
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
            userId,
            tokens.access_token,
            tokens.refresh_token || null, // Refresh token is only sent the first time
            tokens.expiry_date,
            tokens.scope,
            tokens.token_type
        ]
    });
    
    return tokens;
};

export const getClientForUser = async (userId) => {
    const res = await db.execute({
        sql: 'SELECT * FROM google_tokens WHERE user_id = ?',
        args: [userId]
    });

    if (res.rows.length === 0) return null;

    const tokens = res.rows[0];
    const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date
    });

    // Handle token refresh
    client.on('tokens', async (newTokens) => {
        if (newTokens.access_token) {
            await db.execute({
                sql: 'UPDATE google_tokens SET access_token = ?, expiry_date = ? WHERE user_id = ?',
                args: [newTokens.access_token, newTokens.expiry_date, userId]
            });
        }
    });

    return client;
};
