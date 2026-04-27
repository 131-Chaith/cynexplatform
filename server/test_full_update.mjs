import axios from 'axios';

async function testFullUpdateWithPassword() {
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

        // 2. Fetch student 5 (Sai / raj@gmail.com)
        const studentId = 5;
        const studentsRes = await axios.get(`${API_URL}/admin/students`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const student = studentsRes.data.find(s => s.id === studentId);
        if (!student) throw new Error(`Student ${studentId} not found`);

        // 3. Update with ALL details + NEW PASSWORD
        const newPassword = 'newpassword123';
        console.log(`Updating student ${student.name} (raj@gmail.com) with full details and new password...`);
        const updateData = {
            name: "Sai Persistent",
            email: "raj@gmail.com",
            phone: "9988776655",
            dob: "1988-10-10",
            address: "Persistence Lane 1",
            gender: "Male",
            guardian_name: "Guardian P",
            guardian_contact: "1112223333",
            previous_qualification: "Master of Persistence",
            batch_id: 1,
            password: newPassword
        };

        const updateRes = await axios.put(`${API_URL}/admin/students/${studentId}`, updateData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Update Response:', updateRes.data);

        // 4. Verify in DB via GET
        console.log("Verifying data persistence via GET...");
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

            if (String(actual) !== String(expected)) {
                console.log(`FAILURE: Field ${field} mismatch. Expected: ${expected}, Actual: ${actual}`);
                dataMatched = false;
            }
        });

        // 5. Verify Password (by trying to login)
        console.log("Verifying password update by attempting login...");
        try {
            await axios.post(`${API_URL}/auth/login`, {
                email: updateData.email,
                password: newPassword
            });
            console.log("SUCCESS: New password login worked.");
        } catch (err) {
            console.log("FAILURE: New password login failed.");
            dataMatched = false;
        }

        if (dataMatched) {
            console.log("OVERALL SUCCESS: All details and password persisted correctly.");
        } else {
            console.log("OVERALL FAILURE: Some details or password did not update.");
        }

    } catch (e) {
        console.error("Test failed:", e.response?.data || e.message);
    }
}

testFullUpdateWithPassword();
