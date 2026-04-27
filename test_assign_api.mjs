import axios from 'axios';

async function testAssignAPI() {
    try {
        // First login to get token
        console.log('Logging in as admin...');
        const loginRes = await axios.post('http://localhost:5002/api/auth/login', {
            email: 'admin@cynex.ai',
            password: 'admin123'
        });

        const token = loginRes.data.token;
        console.log('✅ Login successful, got token');

        // Get batches
        console.log('\nFetching batches...');
        const batchesRes = await axios.get('http://localhost:5002/api/batches', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Batches:', batchesRes.data.map(b => ({ id: b.id, name: b.batch_name })));

        if (batchesRes.data.length === 0) {
            console.log('No batches found!');
            return;
        }

        const batchId = batchesRes.data[0].id;
        console.log(`\nUsing batch ID: ${batchId}`);

        // Get students
        console.log('\nFetching students...');
        const studentsRes = await axios.get('http://localhost:5002/api/admin/students', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Students:', studentsRes.data.map(s => ({ id: s.id, name: s.name })));

        if (studentsRes.data.length === 0) {
            console.log('No students found!');
            return;
        }

        const studentIds = studentsRes.data.slice(0, 2).map(s => s.id);
        console.log(`\nAssigning students [${studentIds.join(', ')}] to batch ${batchId}...`);

        // Try to assign
        const assignRes = await axios.post(
            `http://localhost:5002/api/batches/${batchId}/students`,
            { student_ids: studentIds },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('✅ Assignment successful!');
        console.log('Response:', assignRes.data);

    } catch (error) {
        console.error('❌ Error occurred:');
        console.error('Status:', error.response?.status);
        console.error('Message:', error.response?.data?.message || error.message);
        console.error('Full error:', error.response?.data);
    }
}

testAssignAPI();
