
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './server/.env' });

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const API_URL = 'http://localhost:5002/api';

async function testApi() {
    try {
        console.log("Generating token for Student ID: 1001");
        const token = jwt.sign({ id: 1001, email: 'student@gmail.com', role: 'student' }, JWT_SECRET);
        
        console.log("Calling /api/courses...");
        const res = await axios.get(`${API_URL}/courses`, {
            headers: { Authorization: `Bearer ${token}` }
        }, { timeout: 5000 });
        
        console.log("Response Status:", res.status);
        console.log("Courses Found:", res.data.length);
        console.log(JSON.stringify(res.data, null, 2));

    } catch (error) {
        console.error("Test failed:", error.response?.data || error.message);
    }
}

testApi();
