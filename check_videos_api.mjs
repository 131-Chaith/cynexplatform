import axios from 'axios';

async function checkVideos() {
    try {
        console.log("Fetching videos from API...");
        // Login first to get token
        const loginRes = await axios.post('http://localhost:5002/api/auth/login', {
            email: 'admin@cynex.ai',
            password: 'admin123'
        });
        const token = loginRes.data.token;

        // Fetch videos
        const res = await axios.get('http://localhost:5002/api/videos', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Videos from API:");
        const videos = res.data.map(v => ({
            id: v.id,
            title: v.title,
            course_id: v.course_id,
            module_id: v.module_id
        }));
        console.log(JSON.stringify(videos, null, 2));
    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
    }
}

checkVideos();
