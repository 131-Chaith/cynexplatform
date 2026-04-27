const fs = require('fs');
const path = require('path');
const { createClient } = require("@libsql/client");

// Manually read .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function checkVideos() {
    try {
        console.log("Checking videos...");
        const result = await db.execute('SELECT id, title, course_id, module_id FROM videos');
        console.log("Videos in DB:");
        console.table(result.rows);
    } catch (error) {
        console.error("Error fetching videos:", error);
    }
}

checkVideos();
