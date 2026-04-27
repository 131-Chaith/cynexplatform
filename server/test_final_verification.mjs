import axios from 'axios';

async function testFinalVerification() {
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

        // 3. Update with NEW UNIQUE values to be sure
        const timestamp = Date.now();
        const newPassword = 'finalpassword' + timestamp;
        console.log(`Updating student ID ${studentId} with unique timestamped values...`);

        const updateData = {
            name: "Final Sai " + timestamp,
            email: "raj@gmail.com",
            phone: "9" + String(timestamp).slice(-9),
            dob: "1990-01-01",
            address: "Final persistence address " + timestamp,
            gender: "Male",
            guardian_name: "Final Guardian " + timestamp,
            guardian_contact: "8" + String(timestamp).slice(-9),
            previous_qualification: "Finalized degree",
            batch_id: 1,
            password: newPassword
        };

        const updateRes = await axios.put(`${API_URL}/admin/students/${studentId}`, updateData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Update Response:', updateRes.data);

        // 4. Verify in DB via GET
        console.log("Verifying via GET...");
        const verifyRes = await axios.get(`${API_URL}/admin/students`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const updatedStudent = verifyRes.data.find(s => s.id === studentId);

        const fieldsToVerify = ['name', 'phone', 'dob', 'address', 'gender', 'guardian_name', 'guardian_contact', 'previous_qualification', 'batch_id'];
        let dataMatched = true;
        fieldsToVerify.forEach(field => {
            let expected = updateData[field];
            let actual = updatedStudent[field];
            if (field === 'dob' && actual) actual = actual.split(' ')[0];

            if (String(actual).trim() !== String(expected).trim()) {
                console.log(`FAILURE: Field ${field} mismatch. Expected: [${expected}], Actual: [${actual}]`);
                dataMatched = false;
            }
        });

        // 5. Verify Password
        console.log("Verifying password update...");
        try {
            await axios.post(`${API_URL}/auth/login`, {
                email: updateData.email,
                password: newPassword
            });
            console.log("SUCCESS: Password verified via login.");
        } catch (err) {
            console.log("FAILURE: Password login failed.");
            dataMatched = false;
        }

        if (dataMatched) {
            console.log("OVERALL SUCCESS: All details persisted and password updated correctly.");
        } else {
            console.log("OVERALL FAILURE: Persistent mismatch detected.");
        }

    } catch (e) {
        console.error("Test failed:", e.response?.data || e.message);
    }
}

testFinalVerification();
