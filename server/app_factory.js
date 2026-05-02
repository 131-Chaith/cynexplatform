import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createModularApp(routePath, router) {
    const app = express();
    
    const corsOptions = {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: false
    };
    app.use(cors(corsOptions));
    app.options('(.*)', cors(corsOptions)); // Express 5 wildcard syntax
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    
    // Static uploads (Note: This is disabled on Vercel to prevent bundling large files)
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
        // Point to the root-level folder where we moved the large videos
        app.use('/uploads', express.static(path.join(__dirname, '../_local_uploads_ignore')));
    }

    // Apply the router to the specified path
    app.use(routePath, router);

    // Basic health check
    app.get('/', (req, res) => {
        res.json({ message: `Modular API (${routePath}) is running` });
    });

    return app;
}
