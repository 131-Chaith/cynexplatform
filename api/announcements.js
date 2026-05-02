import { createModularApp } from '../server/app_factory.js';
import announcementsRouter from '../server/routes/announcements.js';

export default createModularApp('/api/announcements', announcementsRouter);
