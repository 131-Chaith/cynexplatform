import { db } from './db.js';

const testQuery = async () => {
    try {
        const result = await db.execute(`
            SELECT 
                u.id as id, u.name, u.email, u.role, u.created_at, u.batch_id,
                s.phone, s.dob, s.address, s.gender, s.guardian_name, s.guardian_contact, s.previous_qualification,
                (SELECT GROUP_CONCAT(c.title, ', ') 
                 FROM enrollments e 
                 JOIN courses c ON e.course_id = c.id 
                 WHERE e.student_id = u.id) as enrolled_courses,
                b.batch_name as batch_name
            FROM users u
            LEFT JOIN students s ON u.id = s.user_id
            LEFT JOIN batches b ON u.batch_id = b.id
            WHERE u.role = 'student'
            ORDER BY u.created_at DESC
        `);
        console.log("Success! Row count:", result.rows.length);
    } catch (e) {
        console.error("QUERY FAILED:", e.message);
        if (e.cause) console.error("CAUSE:", e.cause.message);
    }
};

testQuery();
