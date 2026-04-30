import { db } from './db.js';

const fixDatabase = async () => {
    try {
        console.log("Fixing database schema: Adding profile_photo to users table...");
        
        // Check if column already exists to avoid errors
        const tableInfo = await db.execute("PRAGMA table_info(users)");
        const hasProfilePhoto = tableInfo.rows.some(row => row.name === 'profile_photo');
        
        if (!hasProfilePhoto) {
            await db.execute("ALTER TABLE users ADD COLUMN profile_photo TEXT");
            console.log("Column 'profile_photo' added to 'users' table.");
        } else {
            console.log("Column 'profile_photo' already exists in 'users' table.");
        }

        console.log("Database fix completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Database fix failed:", error);
        process.exit(1);
    }
};

fixDatabase();
