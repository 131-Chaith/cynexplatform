import axios from 'axios';

async function testApi() {
    try {
        console.log("Fetching test token for admin@cynex.ai...");
        const loginRes = await axios.post('http://localhost:5002/api/auth/login', {
            email: 'admin@cynex.ai',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log("Token received.");

        console.log("Testing /api/attendance/generate-meet...");
        const res = await axios.get('http://localhost:5002/api/attendance/generate-meet', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("Response Status:", res.status);
        console.log("Response Data:", JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error("API Error:", err.response?.data || err.message);
    }
}

testApi();
