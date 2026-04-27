import { db } from './db.js';

const migrate = async () => {
    try {
        console.log("Adding module_id column to mock_tests...");
        await db.execute("ALTER TABLE mock_tests ADD COLUMN module_id INTEGER");
        console.log("Migration successful!");
    } catch (error) {
        if (error.message.includes("duplicate column name")) {
            console.log("Column already exists.");
        } else {
            console.error("Migration failed:", error);
        }
    }
};

migrate();
