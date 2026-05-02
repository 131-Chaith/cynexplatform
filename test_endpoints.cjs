const axios = require('axios');

async function test() {
    try {
        const baseUrl = 'http://localhost:5002/api';
        
        console.log('Logging in as admin...');
        let adminRes = await axios.post(baseUrl + '/auth/login', { email: 'admin@cynex.ai', password: 'admin123' });
        const adminToken = adminRes.data.token;
        console.log('Admin login successful.');
        
        console.log('Fetching test results...');
        let results = await axios.get(baseUrl + '/admin/test-results', { headers: { Authorization: 'Bearer ' + adminToken } });
        console.log('Test results count:', results.data.length);
        if (results.data.length > 0) {
             console.log('Sample result batch name:', results.data[0].batch_name);
        } else {
             console.log('No test results found to verify batch_name, but endpoint works.');
        }

        console.log('Logging in as student...');
        let stuRes = await axios.post(baseUrl + '/auth/login', { email: 'student@cynex.ai', password: 'student123' });
        const stuToken = stuRes.data.token;
        console.log('Student login successful.');

        console.log('Fetching student assignments...');
        let assigns = await axios.get(baseUrl + '/students/assignments', { headers: { Authorization: 'Bearer ' + stuToken } });
        console.log('Assignments found:', assigns.data.length);
        
        if (assigns.data.length > 0) {
            const assignmentId = assigns.data[0].id;
            console.log('Submitting assignment ID:', assignmentId);
            
            let submitRes = await axios.post(baseUrl + '/students/assignments/submit', {
                assignment_id: assignmentId,
                submission_code: 'console.log("Hello World");',
                type: 'interactive',
                score: 100
            }, { headers: { Authorization: 'Bearer ' + stuToken } });
            
            console.log('Submission result:', submitRes.data.message);
        } else {
            console.log('No assignments found to test submission.');
        }

        console.log('All tests passed successfully!');
    } catch (e) {
        console.error('Error during test:', e.response ? e.response.data : e.message);
    }
}
test();
