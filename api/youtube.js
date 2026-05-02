import { createModularApp } from '../server/app_factory.js';
import youtubeRouter from '../server/routes/youtube.js';

export default createModularApp('/api/youtube', youtubeRouter);
