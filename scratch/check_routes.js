import router from '../server/routes/attendance.js';

console.log("Routes in attendanceRouter:");
router.stack.forEach((r) => {
    if (r.route && r.route.path) {
        console.log(`${Object.keys(r.route.methods).join(',').toUpperCase()} ${r.route.path}`);
    }
});

process.exit();
