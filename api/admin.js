import { createModularApp } from '../server/app_factory.js';
import adminRoutes from '../server/routes/admin.js';

export default createModularApp('/api/admin', adminRoutes);
