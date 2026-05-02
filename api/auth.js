import { createModularApp } from '../server/app_factory.js';
import authRoutes from '../server/routes/auth.js';

export default createModularApp('/api/auth', authRoutes);
