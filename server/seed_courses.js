import { db } from './db.js';

const seedData = async () => {
    try {
        console.log("Seeding IT Courses...");

        const courses = [
            { title: "Full Stack Web Development", desc: "Master React, Node.js and SQLite.", dur: "24 Weeks" },
            { title: "Python for Data Science", desc: "Learn Pandas, Numpy and Machine Learning.", dur: "16 Weeks" },
            { title: "Cloud Computing with AWS", desc: "Deploy scalable applications on Amazon Web Services.", dur: "12 Weeks" },
            { title: "Cybersecurity Essentials", desc: "Learn to protect networks and systems.", dur: "10 Weeks" }
        ];

        for (const c of courses) {
            await db.execute({
                sql: "INSERT OR IGNORE INTO courses (title, description, duration) VALUES (?, ?, ?)",
                args: [c.title, c.desc, c.dur]
            });
        }

        // Link them to the default batch (id: 1)
        const allCourses = await db.execute("SELECT id FROM courses");
        for (const course of allCourses.rows) {
            await db.execute({
                sql: "INSERT OR IGNORE INTO batch_courses (batch_id, course_id) VALUES (1, ?)",
                args: [course.id]
            });
        }

        console.log("IT Courses added and linked successfully!");
    } catch (error) {
        console.error("Seeding failed:", error);
    }
};

seedData();
