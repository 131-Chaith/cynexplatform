import { createModularApp } from '../server/app_factory.js';
import attendanceRouter from '../server/routes/attendance.js';

export default createModularApp('/api/attendance', attendanceRouter);
