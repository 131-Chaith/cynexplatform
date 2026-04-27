import axios from 'axios';

async function verify() {
    const students = [
        { email: 'venky@gmail.com', password: 'password123' },
        { email: 'raj@gmail.com', password: 'student123' }
    ];

    for (const student of students) {
        try {
            const res = await axios.post('http://localhost:5002/api/auth/login', {
                email: student.email,
                password: student.password
            });
            console.log(`✅ Login successful for ${student.email}`);
        } catch (error) {
            console.error(`❌ Login failed for ${student.email}:`, error.response?.data || error.message);
        }
    }
}

verify();
