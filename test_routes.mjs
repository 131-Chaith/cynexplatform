import axios from 'axios';

async function testRoutes() {
    try {
        // Login
        const loginRes = await axios.post('http://localhost:5002/api/auth/login', {
            email: 'admin@cynex.ai',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('✅ Logged in');

        // Test GET /api/batches
        try {
            const batchesRes = await axios.get('http://localhost:5002/api/batches', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ GET /api/batches works -', batchesRes.data.length, 'batches found');
        } catch (e) {
            console.log('❌ GET /api/batches failed:', e.response?.status, e.response?.data);
        }

        // Test GET /api/batches/1/students
        try {
            const studentsRes = await axios.get('http://localhost:5002/api/batches/1/students', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ GET /api/batches/1/students works -', studentsRes.data.length, 'students found');
        } catch (e) {
            console.log('❌ GET /api/batches/1/students failed:', e.response?.status, e.response?.statusText);
        }

        // Test POST /api/batches/1/students
        try {
            const assignRes = await axios.post('http://localhost:5002/api/batches/1/students',
                { student_ids: [1] },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('✅ POST /api/batches/1/students works:', assignRes.data);
        } catch (e) {
            console.log('❌ POST /api/batches/1/students failed:', e.response?.status, e.response?.statusText);
            console.log('   Error:', e.response?.data);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testRoutes();
