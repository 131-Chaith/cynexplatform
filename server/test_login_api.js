import axios from 'axios';

async function test() {
    try {
        console.log('Attempting login with wrong password...');
        const response = await axios.post('http://localhost:5002/api/auth/login', {
            email: 'admin@gmail.com',
            password: 'wrongpassword'
        });
        console.log('Response:', response.data);
    } catch (error) {
        console.log('Error Status:', error.response?.status);
        console.log('Error Data:', error.response?.data);
    }
}

test();
