import { db } from './db.js';

const migrate = async () => {
    try {
        console.log("Adding answers column to test_results...");
        await db.execute("ALTER TABLE test_results ADD COLUMN answers JSON");
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
