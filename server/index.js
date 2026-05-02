import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import express from 'express';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables immediately
dotenv.config({ path: path.join(__dirname, '.env') });

import { db } from './db.js';

// Routes
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import studentRoutes from './routes/students.js';
import adminRoutes from './routes/admin.js';
import projectRoutes from './routes/projects.js';
import batchesRouter from './routes/batches.js';
import modulesRouter from './routes/modules.js';
import videosRouter from './routes/videos.js';
import attendanceRouter from './routes/attendance.js';
import youtubeRouter from './routes/youtube.js';
import announcementsRouter from './routes/announcements.js';

const app = express();
// Support for environment variables from Render dashboard (PORT)
const PORT = process.env.PORT || 5002;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Proper CORS configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));

// Standard middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Static files (local only)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.use('/uploads', express.static(path.join(__dirname, '../_local_uploads_ignore')));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/batches', batchesRouter);
app.use('/api/modules', modulesRouter);
app.use('/api/videos', videosRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/youtube', youtubeRouter);
app.use('/api/announcements', announcementsRouter);

// Proper health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        database: process.env.TURSO_DATABASE_URL ? 'connected' : 'local',
        timestamp: new Date()
    });
});

// Basic landing
app.get('/', (req, res) => {
    res.json({ message: 'Cynex Portal API is active' });
});

// Proper catch-all route using '*'
app.all('*', (req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        message: `Route ${req.originalUrl} does not exist on this server.`
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server starting on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
