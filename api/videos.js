import { createModularApp } from '../server/app_factory.js';
import videosRouter from '../server/routes/videos.js';

export default createModularApp('/api/videos', videosRouter);
