import axios from 'axios';

async function testLogin() {
    try {
        console.log("Testing login API endpoint...\n");
        console.log("URL: http://localhost:5002/api/auth/login");
        console.log("Credentials: admin@cynex.ai / admin123\n");

        const response = await axios.post('http://localhost:5002/api/auth/login', {
            email: 'admin@cynex.ai',
            password: 'admin123'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log("✅ LOGIN SUCCESSFUL!");
        console.log("\nResponse data:");
        console.log(JSON.stringify(response.data, null, 2));

        process.exit(0);
    } catch (error) {
        console.log("❌ LOGIN FAILED!");

        if (error.response) {
            console.log("\nStatus:", error.response.status);
            console.log("Error message:", error.response.data?.message || error.response.data);
        } else if (error.request) {
            console.log("\n❌ No response from server!");
            console.log("Is the backend server running on port 5002?");
        } else {
            console.log("\nError:", error.message);
        }

        process.exit(1);
    }
}

testLogin();
