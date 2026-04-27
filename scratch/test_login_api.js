import fetch from 'node-fetch';

async function testLogin(email, password) {
    console.log(`Testing login for ${email}...`);
    try {
        const res = await fetch('http://localhost:5002/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        console.log(`Status: ${res.status}`);
        console.log('Response:', data);
    } catch (e) {
        console.error('Fetch Error:', e);
    }
}

async function run() {
    await testLogin('admin@gmail.com', 'admin123');
    console.log('---');
    await testLogin('student@gmail.com', 'student123');
}

run();
