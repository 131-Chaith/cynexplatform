import { db } from './db.js';

const seedBatches = async () => {
    try {
        console.log("Seeding batches...");
        
        const batches = [
            '2020',
            '2021',
            '2022',
            '2023',
            '2024',
            '2025',
            '2026'
        ];

        for (const batchName of batches) {
            await db.execute({
                sql: "INSERT OR IGNORE INTO batches (batch_name) VALUES (?)",
                args: [batchName]
            });
            console.log(`Added batch: ${batchName}`);
        }

        console.log("Seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedBatches();
