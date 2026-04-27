import { db } from '../db.js';

export const logActivity = async (userId, action, module, details) => {
    try {
        await db.execute({
            sql: "INSERT INTO activity_logs (user_id, action, module, details) VALUES (?, ?, ?, ?)",
            args: [userId, action, module, details]
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
};

export const activityLogger = (module) => {
    return async (req, res, next) => {
        // Capture original send/json to log success
        const originalSend = res.send;
        res.send = function (data) {
            res.send = originalSend;

            // Log only on success status
            if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
                const action = `${req.method} ${req.path}`;
                const details = JSON.stringify(req.body);
                logActivity(req.user.id, action, module, details);
            }

            return res.send(data);
        };
        next();
    };
};
