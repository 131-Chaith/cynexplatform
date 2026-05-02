import { createModularApp } from '../server/app_factory.js';
import batchesRouter from '../server/routes/batches.js';

export default createModularApp('/api/batches', batchesRouter);
