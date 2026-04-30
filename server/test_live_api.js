import { db } from './db.js';

// Test the live HTTP API endpoints
const BASE = 'http://localhost:5002/api';

const login = async (email, password) => {
    const res = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    return data;
};

const apiGet = async (path, token) => {
    const res = await fetch(`${BASE}${path}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
};

const apiPost = async (path, token, body) => {
    const res = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
    });
    return res.json();
};

const run = async () => {
    console.log('==============================');
    console.log('  LIVE API END-TO-END TESTS');
    console.log('==============================\n');

    // --- Admin login ---
    console.log('1. Admin Login...');
    const adminLogin = await login('admin@gmail.com', 'admin123');
    if (!adminLogin.token) {
        console.error('❌ Admin login failed:', adminLogin);
        return;
    }
    console.log(`✅ Admin logged in: ${adminLogin.user.name} (${adminLogin.user.role})`);
    const adminToken = adminLogin.token;

    // --- Student login ---
    console.log('\n2. Student Login...');
    const studentLogin = await login('student@gmail.com', 'student123');
    if (!studentLogin.token) {
        console.error('❌ Student login failed:', studentLogin);
        console.log('   Trying student@cynex.ai...');
        const alt = await login('student@cynex.ai', 'student123');
        if (!alt.token) { console.error('❌ All student logins failed'); }
        else console.log(`✅ Student logged in: ${alt.user.name}`);
    } else {
        console.log(`✅ Student logged in: ${studentLogin.user.name} (ID:${studentLogin.user.id})`);
    }
    const studentToken = studentLogin.token;
    const studentId = studentLogin.user?.id || 2;

    // --- Enroll student in course 1 so classes show up ---
    console.log('\n3. Enrolling student in course "Full Stack Java" (ID:1)...');
    const enrollRes = await apiPost('/admin/enroll', adminToken, { student_id: studentId, course_id: 1 });
    console.log('   Enrollment result:', enrollRes.message || JSON.stringify(enrollRes));

    // --- Post a new announcement ---
    console.log('\n4. Admin posting announcement...');
    const annRes = await apiPost('/announcements', adminToken, {
        title: 'API Test Announcement',
        message: 'This announcement was posted via the live API test.',
        target_type: 'all',
        status: 'published',
        publish_at: new Date().toISOString().slice(0, 16)
    });
    console.log('   Announcement result:', annRes.message || JSON.stringify(annRes));

    // --- Student fetches announcements ---
    console.log('\n5. Student fetching announcements...');
    if (studentToken) {
        const anns = await apiGet('/announcements/student', studentToken);
        if (Array.isArray(anns) && anns.length > 0) {
            console.log(`✅ Student sees ${anns.length} announcement(s):`);
            anns.forEach(a => console.log(`   - "${a.title}" [${a.status}] → target: ${a.target_type}`));
        } else {
            console.error('❌ Student sees NO announcements:', JSON.stringify(anns));
        }
    }

    // --- Admin adds a class session ---
    console.log('\n6. Admin adding class session to course 1...');
    const classRes = await apiPost('/courses/1/classes', adminToken, {
        title: 'Live API Test Class',
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        schedule: new Date(Date.now() + 86400000).toISOString(), // tomorrow
        topic: 'API Testing',
        instructor_name: 'Automated Test'
    });
    console.log('   Class add result:', classRes.message || JSON.stringify(classRes));

    // --- Student fetches classes ---
    console.log('\n7. Student fetching classes...');
    if (studentToken) {
        const classes = await apiGet('/students/classes', studentToken);
        if (Array.isArray(classes) && classes.length > 0) {
            console.log(`✅ Student sees ${classes.length} class(es):`);
            classes.slice(0, 3).forEach(c => console.log(`   - "${c.title}" | course: ${c.course_title}`));
        } else {
            console.error('❌ Student sees NO classes:', JSON.stringify(classes));
        }
    }

    console.log('\n==============================');
    console.log('  ALL TESTS COMPLETE');
    console.log('==============================');
};

run().catch(console.error);
