import { db } from './db.js';

const consolidateCourses = async () => {
    try {
        const res = await db.execute("SELECT id, title FROM courses");
        const rows = res.rows;
        
        const consolidationMap = {
            "Full Stack Java": ["full stack java"],
            "Data Science, AI & Machine Learning": ["Data science AI & Machine Learning"],
            "SAP": ["sap"],
            "Python Programming": ["python Programming"],
            "DevOps & Cloud Technologies": ["devops and cloud commputig"]
        };

        const tablesWithCourseId = [
            'enrollments',
            'batch_courses',
            'course_modules',
            'certificate_requests',
            'certificates',
            'projects',
            'assignments',
            'classes'
        ];

        for (const [standard, variations] of Object.entries(consolidationMap)) {
            const standardCourse = rows.find(r => r.title === standard);
            if (!standardCourse) continue;

            for (const variation of variations) {
                const variationCourse = rows.find(r => r.title.toLowerCase() === variation.toLowerCase() && r.id !== standardCourse.id);
                if (variationCourse) {
                    console.log(`Consolidating '${variationCourse.title}' into '${standard}'...`);
                    
                    for (const table of tablesWithCourseId) {
                        try {
                            await db.execute({
                                sql: `UPDATE ${table} SET course_id = ? WHERE course_id = ?`,
                                args: [standardCourse.id, variationCourse.id]
                            });
                        } catch (err) {
                            // Table might not have course_id or some other issue
                            // console.warn(`Could not update ${table}:`, err.message);
                        }
                    }

                    await db.execute({
                        sql: "DELETE FROM courses WHERE id = ?",
                        args: [variationCourse.id]
                    });
                    
                    console.log(`- Successfully consolidated and removed: ${variationCourse.title}`);
                }
            }
        }

        console.log("Course consolidation completed.");
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

consolidateCourses();
