import express from 'express';
import { youtube as googleYoutube } from '@googleapis/youtube';
import { sheets as googleSheets } from '@googleapis/sheets';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// ─── OAuth2 Client Setup ────────────────────────────────────────────────────
const getOAuth2Client = () => {
    return new OAuth2Client(
        process.env.YOUTUBE_CLIENT_ID,
        process.env.YOUTUBE_CLIENT_SECRET,
        process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:5002/api/youtube/callback'
    );
};

const oauth2Client = getOAuth2Client();

const SCOPES = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/spreadsheets.readonly'
];

// ─── Helper: Load stored tokens ─────────────────────────────────────────────
async function loadTokens() {
    const result = await db.execute({
        sql: 'SELECT * FROM youtube_tokens WHERE id = 1',
        args: []
    });
    return result.rows[0] || null;
}

// ─── Helper: Save tokens to DB ──────────────────────────────────────────────
async function saveTokens(tokens) {
    const existing = await loadTokens();
    if (existing) {
        await db.execute({
            sql: `UPDATE youtube_tokens SET access_token = ?, refresh_token = ?, expiry_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
            args: [tokens.access_token, tokens.refresh_token || existing.refresh_token, tokens.expiry_date || null]
        });
    } else {
        await db.execute({
            sql: `INSERT INTO youtube_tokens (id, access_token, refresh_token, expiry_date) VALUES (1, ?, ?, ?)`,
            args: [tokens.access_token, tokens.refresh_token || null, tokens.expiry_date || null]
        });
    }
}

// ─── Helper: Get authenticated YouTube client ────────────────────────────────
async function getAuthenticatedYoutube() {
    const tokenRow = await loadTokens();
    if (!tokenRow || !tokenRow.refresh_token) {
        throw new Error('NOT_AUTHENTICATED');
    }

    oauth2Client.setCredentials({
        access_token: tokenRow.access_token,
        refresh_token: tokenRow.refresh_token,
        expiry_date: tokenRow.expiry_date
    });

    // Auto-refresh if access token is expired
    if (tokenRow.expiry_date && Date.now() >= Number(tokenRow.expiry_date)) {
        const { credentials } = await oauth2Client.refreshAccessToken();
        await saveTokens(credentials);
        oauth2Client.setCredentials(credentials);
    }

    return googleYoutube({ version: 'v3', auth: oauth2Client });
}

// ─── Helper: Get authenticated Sheets client ─────────────────────────────────
export async function getAuthenticatedSheets() {
    const tokenRow = await loadTokens();
    if (!tokenRow || !tokenRow.refresh_token) {
        throw new Error('NOT_AUTHENTICATED');
    }

    oauth2Client.setCredentials({
        access_token: tokenRow.access_token,
        refresh_token: tokenRow.refresh_token,
        expiry_date: tokenRow.expiry_date
    });

    // Auto-refresh if access token is expired
    if (tokenRow.expiry_date && Date.now() >= Number(tokenRow.expiry_date)) {
        const { credentials } = await oauth2Client.refreshAccessToken();
        await saveTokens(credentials);
        oauth2Client.setCredentials(credentials);
    }

    return googleSheets({ version: 'v4', auth: oauth2Client });
}

// ─── Helper: Extract playlist ID from URL or raw ID ─────────────────────────
function extractPlaylistId(input) {
    if (!input) return null;
    // If it's a full URL
    try {
        const url = new URL(input);
        const listParam = url.searchParams.get('list');
        if (listParam) return listParam;
    } catch (e) { /* not a URL, treat as raw ID */ }
    // If it's a raw playlist ID (starts with PL, UU, LL, etc.)
    if (/^(PL|UU|LL|FL|RD)[a-zA-Z0-9_-]+$/.test(input.trim())) {
        return input.trim();
    }
    return input.trim(); // return as-is and let YouTube API validate
}

// ─── GET /api/youtube/auth-url ───────────────────────────────────────────────
// Returns the Google OAuth URL for admin to click and authorize
router.get('/auth-url', authenticateToken, authorizeRole('admin'), (req, res) => {
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    
    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE' || clientId.startsWith('YOUR_')) {
        return res.status(400).json({ 
            message: 'Google OAuth is not configured. Please set YOUTUBE_CLIENT_ID in server/.env',
            code: 'CONFIG_MISSING'
        });
    }

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent' // Force refresh token every time
    });
    res.json({ authUrl });
});

// ─── GET /api/youtube/callback ───────────────────────────────────────────────
// Handles the OAuth callback from Google, stores tokens
router.get('/callback', async (req, res) => {
    const { code, error } = req.query;

    if (error) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin?youtube_auth=failed&error=${encodeURIComponent(error)}`);
    }

    if (!code) {
        return res.status(400).send('Authorization code missing');
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);
        await saveTokens(tokens);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin?youtube_auth=success`);
    } catch (err) {
        console.error('OAuth callback error:', err);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin?youtube_auth=failed&error=${encodeURIComponent(err.message)}`);
    }
});

// ─── GET /api/youtube/status ─────────────────────────────────────────────────
// Check if admin has connected their Google account
router.get('/status', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const tokenRow = await loadTokens();
        const isConnected = !!(tokenRow && tokenRow.refresh_token);
        res.json({ connected: isConnected, updatedAt: tokenRow?.updated_at || null });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── DELETE /api/youtube/disconnect ──────────────────────────────────────────
// Revoke and remove stored tokens
router.delete('/disconnect', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const tokenRow = await loadTokens();
        if (tokenRow?.access_token) {
            try { await oauth2Client.revokeToken(tokenRow.access_token); } catch (e) { /* ignore if expired */ }
        }
        await db.execute({ sql: 'DELETE FROM youtube_tokens WHERE id = 1', args: [] });
        res.json({ message: 'Disconnected successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /api/youtube/playlist?url=... ───────────────────────────────────────
// Fetch playlist metadata + all video items (handles pagination)
router.get('/playlist', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ message: 'Playlist URL or ID is required' });

    const playlistId = extractPlaylistId(url);
    if (!playlistId) return res.status(400).json({ message: 'Could not extract playlist ID from input' });

    try {
        const youtube = await getAuthenticatedYoutube();

        // 1. Fetch playlist metadata
        const playlistRes = await youtube.playlists.list({
            part: ['snippet', 'contentDetails'],
            id: [playlistId]
        });

        if (!playlistRes.data.items || playlistRes.data.items.length === 0) {
            return res.status(404).json({ message: 'Playlist not found or is not accessible with this account' });
        }

        const playlist = playlistRes.data.items[0];

        // 2. Check if already imported
        const importedCheck = await db.execute({
            sql: 'SELECT * FROM imported_playlists WHERE playlist_id = ?',
            args: [playlistId]
        });
        const alreadyImported = importedCheck.rows.length > 0;

        // 3. Fetch all videos with pagination
        const videos = [];
        let nextPageToken = null;

        do {
            const itemsRes = await youtube.playlistItems.list({
                part: ['snippet', 'contentDetails'],
                playlistId: playlistId,
                maxResults: 50,
                pageToken: nextPageToken || undefined
            });

            for (const item of itemsRes.data.items || []) {
                const snippet = item.snippet;
                const videoId = snippet?.resourceId?.videoId;
                if (!videoId) continue;

                videos.push({
                    videoId,
                    title: snippet.title,
                    description: snippet.description || '',
                    thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || null,
                    position: snippet.position,
                    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`
                });
            }

            nextPageToken = itemsRes.data.nextPageToken;
        } while (nextPageToken);

        // Sort by position to preserve playlist order
        videos.sort((a, b) => a.position - b.position);

        res.json({
            playlistId,
            playlistTitle: playlist.snippet?.title,
            playlistThumbnail: playlist.snippet?.thumbnails?.medium?.url || null,
            totalVideos: videos.length,
            alreadyImported,
            importedAt: importedCheck.rows[0]?.imported_at || null,
            videos
        });
    } catch (err) {
        if (err.message === 'NOT_AUTHENTICATED') {
            return res.status(401).json({ message: 'Google account not connected. Please authenticate first.' });
        }
        console.error('Playlist fetch error:', err);
        res.status(500).json({ message: err.message });
    }
});

// ─── POST /api/youtube/import ─────────────────────────────────────────────────
// Import selected videos from a playlist into a course/module
router.post('/import', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { playlistId, playlistTitle, courseId, moduleId, videos } = req.body;

    if (!videos || !Array.isArray(videos) || videos.length === 0) {
        return res.status(400).json({ message: 'No videos selected for import' });
    }
    if (!courseId) {
        return res.status(400).json({ message: 'Course ID is required' });
    }

    try {
        let insertedCount = 0;

        for (let i = 0; i < videos.length; i++) {
            const video = videos[i];
            await db.execute({
                sql: `INSERT INTO videos (title, description, youtube_url, course_id, module_id, duration, order_index)
                      VALUES (?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    video.title,
                    video.description || null,
                    video.youtubeUrl,
                    courseId,
                    moduleId || null,
                    null, // duration not available from playlist item API
                    video.position ?? i
                ]
            });
            insertedCount++;
        }

        // Mark playlist as imported (upsert)
        if (playlistId) {
            await db.execute({
                sql: `INSERT INTO imported_playlists (playlist_id, playlist_title) VALUES (?, ?)
                      ON CONFLICT(playlist_id) DO UPDATE SET playlist_title = ?, imported_at = CURRENT_TIMESTAMP`,
                args: [playlistId, playlistTitle || null, playlistTitle || null]
            });
        }

        res.json({ message: `Successfully imported ${insertedCount} videos`, count: insertedCount });
    } catch (err) {
        console.error('Import error:', err);
        res.status(500).json({ message: err.message });
    }
});

export default router;
