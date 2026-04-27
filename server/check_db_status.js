import { createClient } from "@libsql/client";

const db = createClient({
    url: "file:local.db"
});

async function check() {
    try {
        const result = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
        console.log("Tables found:", result.rows);
        
        if (result.rows.length > 0) {
            const users = await db.execute("SELECT id, email, role FROM users");
            console.log("Users in DB:", users.rows);
        } else {
            console.log("Users table does not exist!");
        }
    } catch (error) {
        console.error("DB Error:", error);
    }
}

check();
