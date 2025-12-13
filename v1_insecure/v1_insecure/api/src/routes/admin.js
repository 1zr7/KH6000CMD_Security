const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');
const md5 = (str) => crypto.createHash('md5').update(str).digest('hex');

// Create user (Admin only, but no check)
router.post('/users', async (req, res, next) => {
    try {
        const { username, password, role, name, specialty } = req.body;
        const hash = md5(password);

        // WARNING: SQL Injection
        const userQuery = `INSERT INTO users (username, password, role) VALUES ('${username}', '${hash}', '${role}') RETURNING id`;
        const userRes = await db.query(userQuery);
        const userId = userRes.rows[0].id;

        if (role === 'doctor') {
            await db.query(`INSERT INTO doctors (user_id, name, specialty) VALUES (${userId}, '${name}', '${specialty}')`);
        } else if (role === 'nurse') {
            await db.query(`INSERT INTO nurses (user_id, name) VALUES (${userId}, '${name}')`);
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
        // WARNING: SQL Injection
        const query = `DELETE FROM users WHERE id = ${id}`;
        await db.query(query);
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
