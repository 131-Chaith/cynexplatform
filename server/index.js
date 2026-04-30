import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
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


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5002;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}


app.use(cors());
app.use(express.json());

// Global Logger (Temporary)
app.use((req, res, next) => {
    console.log(`[GLOBAL LOG] ${req.method} ${req.originalUrl}`);
    next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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


app.get('/', (req, res) => {
    res.json({ message: 'Student Portal API is running' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;

