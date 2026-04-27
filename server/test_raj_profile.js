import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5002/api/',
});

async function test() {
    try {
        console.log("Logging in as raj@gmail.com...");
        const loginRes = await api.post('/auth/login', {
            email: 'raj@gmail.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log("Token obtained.");

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        console.log("Fetching /students/profile-full...");
        const profileRes = await api.get('/students/profile-full');
        console.log("Status:", profileRes.status);
        console.log("Data user:", profileRes.data.user.name);
        console.log("Data profile:", JSON.stringify(profileRes.data.profile, null, 2));
    } catch (err) {
        console.error("Test failed:", err.response?.status, err.response?.data || err.message);
    }
}
test();
