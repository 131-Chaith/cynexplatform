import axios from 'axios';

async function fixVideo() {
    try {
        console.log("Fixing video data...");
        // Login
        const loginRes = await axios.post('http://localhost:5002/api/auth/login', {
            email: 'admin@cynex.ai',
            password: 'admin123'
        });
        const token = loginRes.data.token;

        // Get the video first to preserve other fields
        const videoRes = await axios.get('http://localhost:5002/api/videos/2', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const video = videoRes.data;
        console.log("Current Video:", video);

        // Update module_id to 1 (SQL) - hardcoded based on previous check
        const updatedVideo = {
            ...video,
            module_id: 1
        };

        // Update video
        await axios.put('http://localhost:5002/api/videos/2', updatedVideo, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("✅ Video updated successfully!");

    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
    }
}

fixVideo();
