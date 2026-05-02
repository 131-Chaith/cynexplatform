import { createModularApp } from '../server/app_factory.js';
import courseRoutes from '../server/routes/courses.js';

export default createModularApp('/api/courses', courseRoutes);
