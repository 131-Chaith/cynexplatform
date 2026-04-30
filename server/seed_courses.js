import { db } from './db.js';

const courses = [
    {
        title: "Full Stack Java",
        description: "Master end-to-end web development using Java, Spring Boot, and modern frontend frameworks.",
        duration: "6 Months"
    },
    {
        title: "Data Science, AI & Machine Learning",
        description: "Dive deep into data analysis, statistical modeling, and building intelligent AI systems.",
        duration: "6 Months"
    },
    {
        title: "SAP",
        description: "Comprehensive training on SAP ERP modules, including S/4HANA, FICO, and MM.",
        duration: "4 Months"
    },
    {
        title: "Python Programming",
        description: "Learn Python from scratch to advanced concepts, focusing on automation and scripting.",
        duration: "3 Months"
    },
    {
        title: "DevOps & Cloud Technologies",
        description: "Master CI/CD pipelines, Docker, Kubernetes, and major cloud platforms like AWS and Azure.",
        duration: "5 Months"
    },
    {
        title: "Software Testing (Manual + Automation)",
        description: "Learn to ensure software quality through rigorous manual testing and Selenium automation.",
        duration: "4 Months"
    },
    {
        title: "Digital Marketing",
        description: "Strategize and execute campaigns using SEO, SEM, Social Media, and Content Marketing.",
        duration: "3 Months"
    },
    {
        title: "Advanced Excel",
        description: "Become an Excel power user with advanced formulas, Pivot Tables, and VBA macros.",
        duration: "2 Months"
    },
    {
        title: "Artificial Intelligence & Generative AI",
        description: "Explore the cutting edge of AI, including LLMs, GANs, and prompt engineering.",
        duration: "4 Months"
    },
    {
        title: "Soft Skills and Career Boosters",
        description: "Enhance your professional presence with communication, leadership, and interview preparation.",
        duration: "2 Months"
    }
];

const seedCourses = async () => {
    try {
        console.log("Synchronizing course catalog with standard titles...");
        
        for (const course of courses) {
            const existing = await db.execute({
                sql: "SELECT id FROM courses WHERE LOWER(title) = LOWER(?)",
                args: [course.title]
            });

            if (existing.rows.length === 0) {
                await db.execute({
                    sql: "INSERT INTO courses (title, description, duration) VALUES (?, ?, ?)",
                    args: [course.title, course.description, course.duration]
                });
                console.log(`+ Added: ${course.title}`);
            } else {
                await db.execute({
                    sql: "UPDATE courses SET title = ?, description = ?, duration = ? WHERE id = ?",
                    args: [course.title, course.description, course.duration, existing.rows[0].id]
                });
                console.log(`~ Updated & Formatted: ${course.title}`);
            }
        }

        console.log("Course catalog synchronization completed.");
        process.exit(0);
    } catch (error) {
        console.error("Sync failed:", error);
        process.exit(1);
    }
};

seedCourses();
