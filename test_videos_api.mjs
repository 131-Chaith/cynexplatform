import axios from 'axios';

async function testVideosAPI() {
    try {
        // Login
        console.log('Logging in as admin...');
        const loginRes = await axios.post('http://localhost:5002/api/auth/login', {
            email: 'admin@cynex.ai',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('✅ Logged in successfully\n');

        // Test GET /api/videos (empty initially)
        console.log('Testing GET /api/videos...');
        const getRes = await axios.get('http://localhost:5002/api/videos', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ GET /api/videos works - ${getRes.data.length} videos found\n`);

        // Test POST /api/videos (create video)
        console.log('Testing POST /api/videos (create video)...');
        const createRes = await axios.post('http://localhost:5002/api/videos', {
            title: 'Introduction to React',
            description: 'Learn the basics of React in this comprehensive tutorial',
            youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration: '15:30',
            order_index: 1
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ POST /api/videos works -', createRes.data.message, '\n');

        // Get videos again to verify creation
        const getRes2 = await axios.get('http://localhost:5002/api/videos', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Video created successfully - now ${getRes2.data.length} video(s) in database`);

        if (getRes2.data.length > 0) {
            const videoId = getRes2.data[0].id;
            console.log(`\nTesting PUT /api/videos/${videoId} (update video)...`);

            // Test PUT /api/videos/:id (update video)
            const updateRes = await axios.put(`http://localhost:5002/api/videos/${videoId}`, {
                title: 'Introduction to React - Updated',
                description: 'Updated description',
                youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: '20:00',
                order_index: 1
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ PUT /api/videos/:id works -', updateRes.data.message);

            // Test DELETE /api/videos/:id
            console.log(`\nTesting DELETE /api/videos/${videoId}...`);
            const deleteRes = await axios.delete(`http://localhost:5002/api/videos/${videoId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ DELETE /api/videos/:id works -', deleteRes.data.message);
        }

        console.log('\n✅ All videos API endpoints working correctly!');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testVideosAPI();
