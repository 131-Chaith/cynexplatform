import { db } from './db.js';

const checkAndClean = async () => {
    try {
        const res = await db.execute("SELECT id, title FROM courses");
        console.log("Current courses:", res.rows.map(r => r.title));
        
        const toDelete = res.rows.filter(r => 
            r.title.toLowerCase().includes('ethical') || 
            r.title.toLowerCase().includes('cyber')
        );

        if (toDelete.length > 0) {
            console.log("Deleting excluded courses:", toDelete.map(r => r.title));
            for (const course of toDelete) {
                await db.execute({
                    sql: "DELETE FROM courses WHERE id = ?",
                    args: [course.id]
                });
            }
        } else {
            console.log("No excluded courses found.");
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkAndClean();
