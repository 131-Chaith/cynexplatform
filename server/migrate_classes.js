import { db } from './db.js';

const migrateClasses = async () => {
    try {
        console.log("Checking classes table columns...");

        // Add module_id column
        try {
            await db.execute("ALTER TABLE classes ADD COLUMN module_id INTEGER");
            console.log("✅ Added module_id column");
        } catch (e) {
            console.log("ℹ️  module_id column already exists (or error):", e.message);
        }

        // Add topic column
        try {
            await db.execute("ALTER TABLE classes ADD COLUMN topic TEXT");
            console.log("✅ Added topic column");
        } catch (e) {
            console.log("ℹ️  topic column already exists (or error):", e.message);
        }

        // Add instructor_name column
        try {
            await db.execute("ALTER TABLE classes ADD COLUMN instructor_name TEXT");
            console.log("✅ Added instructor_name column");
        } catch (e) {
            console.log("ℹ️  instructor_name column already exists (or error):", e.message);
        }

        // Verify final schema
        const info = await db.execute("PRAGMA table_info(classes)");
        console.log("\nFinal classes schema:", info.rows.map(r => r.name).join(', '));
        console.log("\nMigration complete!");
    } catch (e) {
        console.error("Migration failed:", e);
    }
};

migrateClasses();
