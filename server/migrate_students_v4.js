import { db } from './db.js';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
    try {
        console.log("Adding Education fields to students table...");
        
        await db.execute("ALTER TABLE students ADD COLUMN institution TEXT");
        await db.execute("ALTER TABLE students ADD COLUMN highest_qualification TEXT");
        await db.execute("ALTER TABLE students ADD COLUMN year_of_passing TEXT");
        await db.execute("ALTER TABLE students ADD COLUMN resume_link TEXT");
        
        console.log("Migration successful!");
    } catch (e) {
        if (e.message.includes("duplicate column name")) {
            console.log("Columns already exist, skipping.");
        } else {
            console.error("Migration failed:", e);
        }
    }
}

migrate();
