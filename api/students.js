import { createModularApp } from '../server/app_factory.js';
import studentRoutes from '../server/routes/students.js';

export default createModularApp('/api/students', studentRoutes);
