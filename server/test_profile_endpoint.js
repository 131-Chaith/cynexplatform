import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5002/api/',
});

async function test() {
    try {
        console.log("Logging in...");
        const loginRes = await api.post('/auth/login', {
            email: 'prudhvi@gmail.com', // Assuming this user exists from previous context or dump_users
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log("Token obtained.");

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        console.log("Fetching /students/profile-full...");
        const profileRes = await api.get('/students/profile-full');
        console.log("Status:", profileRes.status);
        console.log("Data:", JSON.stringify(profileRes.data, null, 2));
    } catch (err) {
        console.error("Test failed:", err.response?.status, err.response?.data || err.message);
    }
}
test();
