const axios = require('axios');

async function test() {
    try {
        const baseUrl = 'http://localhost:5002/api';
        console.log('Logging in as student...');
        let stuRes = await axios.post(baseUrl + '/auth/login', { email: 'student@cynex.ai', password: 'student123' });
        const stuToken = stuRes.data.token;
        console.log('Student login successful.');

        console.log('Submitting fake assignment...');
        let submitRes = await axios.post(baseUrl + '/students/assignments/submit', {
            assignment_id: 3,
            submission_code: 'console.log("Hello World");',
            type: 'interactive',
            score: 100
        }, { headers: { Authorization: 'Bearer ' + stuToken } });
        
        console.log('Submission result:', submitRes.data.message);
        console.log('Success: No SQLite errors!');
    } catch (e) {
        console.error('Error during test:', e.response ? e.response.data : e.message);
    }
}
test();
