import { db } from './db.js';

const testAll = async () => {
    const studentId = 2; // student@gmail.com
    const batchId = null;

    console.log('=== TEST 1: Student Announcements Query ===');
    try {
        const result = await db.execute({
            sql: `SELECT a.*, u.name as author_name 
                  FROM announcements a
                  LEFT JOIN users u ON a.created_by = u.id
                  WHERE a.status = 'published' 
                  AND datetime(a.publish_at) <= datetime('now', '+6 hours')
                  AND (
                      a.target_type = 'all'
                      OR (a.target_type = 'batch' AND CAST(a.target_id AS TEXT) = CAST(? AS TEXT))
                      OR (a.target_type = 'individual' AND CAST(a.target_id AS TEXT) = CAST(? AS TEXT))
                  )
                  ORDER BY a.publish_at DESC`,
            args: [batchId || '', studentId]
        });
        console.log(`✅ Announcements visible to student (ID:${studentId}):`, result.rows.length);
        result.rows.forEach(a => console.log(`   - "${a.title}" | status:${a.status} | target:${a.target_type} | published:${a.publish_at}`));
    } catch (e) {
        console.error('❌ Announcements query failed:', e.message);
    }

    console.log('\n=== TEST 2: Classes Table Insert ===');
    try {
        const now = new Date().toISOString();
        await db.execute({
            sql: 'INSERT INTO classes (course_id, title, video_url, schedule, module_id, topic, instructor_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
            args: [1, 'Test Class Session 001', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', now, null, 'Introduction', 'Test Instructor']
        });
        const classes = await db.execute('SELECT id, title, topic, instructor_name FROM classes ORDER BY id DESC LIMIT 3');
        console.log(`✅ Class inserted! Total classes now: ${classes.rows.length}`);
        classes.rows.forEach(c => console.log(`   - "${c.title}" | topic:${c.topic} | instructor:${c.instructor_name}`));
    } catch (e) {
        console.error('❌ Class insert failed:', e.message);
    }

    console.log('\n=== TEST 3: Verify Classes Appear in Student /classes ===');
    try {
        // Student enrolled in course 1
        const enroll = await db.execute({ sql: 'SELECT * FROM enrollments WHERE student_id = ?', args: [studentId] });
        console.log(`   Student ${studentId} enrollments:`, enroll.rows.map(e => `course_id=${e.course_id}`).join(', ') || 'none');
        
        const cls = await db.execute({
            sql: `SELECT cl.*, c.title as course_title FROM classes cl 
                  JOIN courses c ON cl.course_id = c.id 
                  WHERE cl.course_id IN (SELECT course_id FROM enrollments WHERE student_id = ?)
                  ORDER BY cl.id DESC`,
            args: [studentId]
        });
        console.log(`   Classes visible to student: ${cls.rows.length}`);
    } catch(e) {
        console.error('❌ Student classes check failed:', e.message);
    }

    console.log('\n=== All tests complete ===');
};

testAll();
