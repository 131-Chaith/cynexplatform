import axios from 'axios';

async function test() {
    try {
        const loginRes = await axios.post('http://localhost:5002/api/auth/login', {
            email: 'admin@cynex.ai',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log("Token obtained");

        const studentsRes = await axios.get('http://localhost:5002/api/admin/students', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Students:", studentsRes.data.length);

        const certsRes = await axios.get('http://localhost:5002/api/admin/certificates-all', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Certificates:", certsRes.data.length);

    } catch (e) {
        console.error("Error:", e.response?.status, e.response?.data || e.message);
    }
}
test();
