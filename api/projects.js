import { createModularApp } from '../server/app_factory.js';
import projectRoutes from '../server/routes/projects.js';

export default createModularApp('/api/projects', projectRoutes);
