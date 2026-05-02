import { db } from '../server/db.js';

async function check() {
    try {
        const courses = await db.execute("SELECT COUNT(*) as count FROM courses");
        const students = await db.execute("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
        const videos = await db.execute("SELECT COUNT(*) as count FROM videos");
        const batches = await db.execute("SELECT COUNT(*) as count FROM batches");
        
        console.log({
            courses: courses.rows[0].count,
            students: students.rows[0].count,
            videos: videos.rows[0].count,
            batches: batches.rows[0].count
        });
    } catch (e) {
        console.error(e);
    }
}

check();
