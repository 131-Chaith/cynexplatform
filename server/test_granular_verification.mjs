import axios from 'axios';

async function testGranularVerification() {
    try {
        const API_URL = 'http://localhost:5002/api';

        // 1. Login as Admin
        console.log("Logging in as admin...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@cynex.ai',
            password: 'admin123'
        });
        const token = loginRes.data.token;

        // 2. Fetch student 5
        const studentId = 5;

        // 3. Update with NEW values
        const timestamp = Date.now();
        console.log(`Updating student ID ${studentId} with timestamp ${timestamp}...`);

        const updateData = {
            name: "Persistent Name " + timestamp,
            email: "raj@gmail.com",
            phone: "9" + String(timestamp).slice(-9),
            dob: "1990-01-01",
            address: "Address " + timestamp,
            gender: "Male",
            guardian_name: "Guardian " + timestamp,
            guardian_contact: "8" + String(timestamp).slice(-9),
            previous_qualification: "PhD " + timestamp,
            batch_id: 1,
            password: '*****'
        };

        // Correct endpoint is /admin/students/:id based on routes/admin.js:215 where router is mounted at /api/admin
        const updateRes = await axios.put(`${API_URL}/admin/students/${studentId}`, updateData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Update Status:', updateRes.status);

        // 4. Verify in DB via GET
        console.log("Verifying via GET /api/admin/students...");
        const verifyRes = await axios.get(`${API_URL}/admin/students`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const updatedStudent = verifyRes.data.find(s => s.id === studentId);

        console.log('--- COMPARISON RESULTS ---');
        const fieldsToVerify = ['name', 'phone', 'dob', 'address', 'gender', 'guardian_name', 'guardian_contact', 'previous_qualification', 'batch_id'];
        fieldsToVerify.forEach(field => {
            let expected = updateData[field];
            let actual = updatedStudent?.[field];
            if (field === 'dob' && actual) actual = actual.split(' ')[0];

            const match = String(actual).trim() === String(expected).trim();
            console.log(`[${match ? 'SUCCESS' : 'FAILURE'}] ${field}: Expected: [${expected}], Actual: [${actual}]`);
        });

    } catch (e) {
        console.error("Test failed:", e.response?.data || e.message);
    }
}

testGranularVerification();
