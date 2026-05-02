import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createModularApp(routePath, router) {
    const app = express();
    
    // Proper CORS configuration
    app.use(cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: false
    }));

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    
    // Static uploads (Note: This is disabled on Vercel/Render production for local files)
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
        app.use('/uploads', express.static(path.join(__dirname, '../_local_uploads_ignore')));
    }

    // Apply the router to the specified path
    app.use(routePath, router);

    // Basic health check
    app.get('/', (req, res) => {
        res.json({ message: `Modular API (${routePath}) is running` });
    });

    // Catch-all for the sub-module
    app.use((req, res) => {
        res.status(404).json({ message: `Route not found in ${routePath}` });
    });

    return app;
}
