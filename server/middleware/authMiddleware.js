import jwt from 'jsonwebtoken';

// Do not call dotenv.config() here, index.js handles it globally.
// If needed for standalone use, use a check.

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access Denied: No Token Provided' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid Token' });
        req.user = user;
        next();
    });
};

export const authorizeRole = (role) => {
    return (req, res, next) => {
        console.log(`[AuthDebug] Checking Role: Required=${role}, UserRole=${req.user?.role}, UserID=${req.user?.id}`);
        if (req.user && (req.user.role === role || req.user.role === 'super_admin')) {
            next();
        } else {
            console.log("[AuthDebug] Access Denied");
            res.status(403).json({ message: 'Access Denied: Insufficient Permissions' });
        }
    };
};
