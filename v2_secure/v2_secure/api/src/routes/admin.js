const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

const { authenticate, authorize } = require('../middleware/auth');
const { logEvent } = require('../utils/audit');

// Secure all admin routes
router.use(authenticate, authorize(['admin']));

// Create user (Admin only)
router.post('/users', async (req, res, next) => {
    try {
        const { username, password, role, name, specialty } = req.body;

        // Input Validation
        if (!username || !password || !role) {
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
        const userQuery = 'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id';
        const userRes = await db.query(userQuery, [username, hash, role]);
        const userId = userRes.rows[0].id;

        if (role === 'doctor') {
            await db.query('INSERT INTO doctors (user_id, name, specialty) VALUES ($1, $2, $3)', [userId, name, specialty]);
        } else if (role === 'nurse') {
            await db.query('INSERT INTO nurses (user_id, name) VALUES ($1, $2)', [userId, name]);
        }

        res.status(201).json({ id: userId, username, role, name });
    } catch (err) {
        next(err);
    }
});

// Delete user
router.delete('/users/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        if (isNaN(parseInt(id))) return res.status(400).json({ error: 'Invalid User ID' });
        const query = 'DELETE FROM users WHERE id = $1';
        await db.query(query, [id]);
        res.json({ message: 'User deleted' });
    } catch (err) {
        next(err);
    }
});

// List all users (helper for admin UI)
router.get('/users', async (req, res, next) => {
    try {
        const result = await db.query('SELECT id, username, role FROM users');
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
