const jwt = require('jsonwebtoken');

console.log('Loading middleware/auth.js');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me_in_prod';

// Authentication Middleware
const authenticate = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

// Authorization Middleware
const authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (roles.length && !roles.includes(req.user.role)) {
            console.log(`[AUTH FAIL] User: ${req.user.username} (Role: ${req.user.role}) attempted to access resource requiring: ${roles.join(', ')}`);
            return res.status(403).json({ error: 'Forbidden: Insufficient rights' });
        }

        next();
    };
};

module.exports = {
    authenticate,
    authorize,
    JWT_SECRET
};
