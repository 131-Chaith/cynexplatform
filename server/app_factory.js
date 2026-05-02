import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createModularApp(routePath, router) {
    const app = express();
    
    app.use(cors());
    app.use(express.json());
    
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
