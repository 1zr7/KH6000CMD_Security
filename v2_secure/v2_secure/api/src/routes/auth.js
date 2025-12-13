const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

router.post('/register', async (req, res, next) => {
    try {
        const { username, password, role, name, dob, address, specialty } = req.body;

        const passwordHash = await bcrypt.hash(password, 10);
        const userRole = role || 'patient';

        const query = {
            text: 'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
            values: [username, passwordHash, userRole]
        };
        const result = await db.query(query);
        const user = result.rows[0];

        // Create profile based on role
        if (userRole === 'patient') {
            await db.query('INSERT INTO patients (user_id, name, dob, address) VALUES ($1, $2, $3, $4)', [user.id, name, dob, address]);
        } else if (userRole === 'doctor') {
            await db.query('INSERT INTO doctors (user_id, name, specialty) VALUES ($1, $2, $3, $4)', [user.id, name, specialty]);
        } else if (userRole === 'nurse') {
            await db.query('INSERT INTO nurses (user_id, name) VALUES ($1, $2)', [user.id, name]);
        }

        res.status(201).json(user);
    } catch (err) {
        next(err);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;

        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            const match = await bcrypt.compare(password, user.password);

            if (match) {
                res.json({
                    message: 'Login successful',
                    user: { id: user.id, username: user.username, role: user.role }
                });
            } else {
                res.status(401).json({ error: 'Invalid username or password' });
            }
        } else {
            res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (err) {
        next(err);
    }
});

router.put('/password', async (req, res, next) => {
    try {
        const { username, newPassword } = req.body;
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = $1 WHERE username = $2', [passwordHash, username]);
        res.json({ message: 'Password updated' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
