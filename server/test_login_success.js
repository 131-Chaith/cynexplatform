import axios from 'axios';

async function test() {
    try {
        console.log('Attempting login with CORRECT password...');
        const response = await axios.post('http://localhost:5002/api/auth/login', {
            email: 'admin@gmail.com',
            password: 'admin123'
        });
        console.log('Response:', response.data);
    } catch (error) {
        console.log('Error Status:', error.response?.status);
        console.log('Error Data:', error.response?.data);
    }
}

test();
