import axios from 'axios';

async function testUpdate() {
    try {
        const API_URL = 'http://localhost:5002/api';

        // 1. Login as Admin
        console.log("Logging in as admin...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@cynex.ai',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log("Login successful.");

        // 2. Fetch student 2
        const studentId = 2;
        const studentsRes = await axios.get(`${API_URL}/admin/students`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const student = studentsRes.data.find(s => s.id === studentId);
        console.log('Current Student Data:', JSON.stringify(student, null, 2));

        // 3. Update batch to 1
        console.log("Updating batch to 1...");
        const updateData = {
            ...student,
            batch_id: 1, // Number
            password: '*****' // As in frontend
        };

        const updateRes = await axios.put(`${API_URL}/admin/students/${studentId}`, updateData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Update Response:', updateRes.data);

        // 4. Verify
        console.log("Verifying update...");
        const verifyRes = await axios.get(`${API_URL}/admin/students`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const updatedStudent = verifyRes.data.find(s => s.id === studentId);
        console.log('Updated Student Data:', JSON.stringify(updatedStudent, null, 2));

        if (updatedStudent.batch_id == 1) {
            console.log("SUCCESS: API updated batch correctly.");
        } else {
            console.log("FAILURE: API did not update batch.");
        }

    } catch (e) {
        console.error("Test failed:", e.response?.data || e.message);
    }
}

testUpdate();
