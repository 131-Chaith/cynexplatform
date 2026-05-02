import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env FIRST before any other imports that need it
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
const PORT = process.env.PORT || 5002;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Full CORS config — allows all origins (required for Vercel frontend + Render backend)
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight for all routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global Logger (Temporary)
app.use((req, res, next) => {
    console.log(`[GLOBAL LOG] ${req.method} ${req.originalUrl}`);
    next();
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.use('/uploads', express.static(path.join(__dirname, '../_local_uploads_ignore')));
}

// Log DB Connection
console.log("Database URL:", process.env.TURSO_DATABASE_URL ? "Loaded" : "Not Loaded");

// Routes
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


app.get('/api', (req, res) => {
    res.json({ 
        message: 'Cynex Portal API is running',
        database: process.env.TURSO_DATABASE_URL ? 'Turso Cloud' : 'Local SQLite',
        env: process.env.NODE_ENV || 'development'
    });
});

app.get('/', (req, res) => {
    res.json({ message: 'Cynex Portal API is running' });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;

