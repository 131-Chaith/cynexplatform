import { createModularApp } from '../server/app_factory.js';
import modulesRouter from '../server/routes/modules.js';

export default createModularApp('/api/modules', modulesRouter);
