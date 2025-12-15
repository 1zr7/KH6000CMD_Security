const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

const { authenticate, authorize } = require('../middleware/auth');
const { logEvent } = require('../utils/audit');

// Secure all admin routes
// Secure admin routes individually or group them. 
// Note: router.use(authenticate, authorize(['admin'])) was removed to allow specific routes to be shared.


// Create user (Admin only)
router.post('/users', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        const { username, password, role, email, name, specialty } = req.body;

        // Input Validation
        if (!username || !password || !role || !email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        const validRoles = ['admin', 'doctor', 'nurse', 'patient'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);

        // Parameterized Query
        const userQuery = 'INSERT INTO users (username, password, role, email) VALUES ($1, $2, $3, $4) RETURNING id';
        const userRes = await db.query(userQuery, [username, hash, role, email]);
        const userId = userRes.rows[0].id;

        if (role === 'doctor') {
            await db.query('INSERT INTO doctors (user_id, name, specialty) VALUES ($1, $2, $3)', [userId, name, specialty]);
        } else if (role === 'nurse') {
            await db.query('INSERT INTO nurses (user_id, name) VALUES ($1, $2)', [userId, name]);
        }

        await logEvent('USER_CREATED', req.user.id, { createdUser: username, role });
        res.status(201).json({ id: userId, username, role, name, email });
    } catch (err) {
        next(err);
    }
});

// Delete user
router.delete('/users/:id', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        const { id } = req.params;
        if (isNaN(parseInt(id))) return res.status(400).json({ error: 'Invalid User ID' });
        const query = 'DELETE FROM users WHERE id = $1';
        await db.query(query, [id]);
        await logEvent('USER_DELETED', req.user.id, { deletedUserId: id });
        res.json({ message: 'User deleted' });
    } catch (err) {
        next(err);
    }
});

// List all users (helper for admin UI and Doctor assignment)
router.get('/users', authenticate, authorize(['admin', 'doctor', 'nurse']), async (req, res, next) => {
    try {
        const result = await db.query('SELECT id, username, role FROM users');
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

// Get Audit Logs (Admin only, Read-only, Paginated)
router.get('/logs', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const offset = (page - 1) * limit;

        const countResult = await db.query('SELECT COUNT(*) FROM audit_log');
        const total = parseInt(countResult.rows[0].count);

        const query = `
            SELECT a.id, a.action, a.actor_id, u.username as actor_name, a.timestamp 
            FROM audit_log a
            LEFT JOIN users u ON a.actor_id = u.id
            ORDER BY a.timestamp DESC 
            LIMIT $1 OFFSET $2
        `;
        const result = await db.query(query, [limit, offset]);

        res.json({
            logs: result.rows,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
