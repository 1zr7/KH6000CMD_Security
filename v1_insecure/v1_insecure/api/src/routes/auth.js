const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');

// Helper for weak hashing
const md5 = (str) => crypto.createHash('md5').update(str).digest('hex');

router.post('/register', async (req, res, next) => {
    try {
        const { username, password, role, name, dob, address, specialty } = req.body;

        // WARNING: intentionally vulnerable logging of full body
        console.log('Register Request Body:', JSON.stringify(req.body));

        const passwordHash = md5(password);
        const userRole = role || 'patient';

        // Check if user exists
        const checkQuery = `SELECT * FROM users WHERE username = '${username}'`;
        const checkResult = await db.query(checkQuery);
        if (checkResult.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // WARNING: intentionally vulnerable SQLi
        const query = `INSERT INTO users (username, password, role) VALUES ('${username}', '${passwordHash}', '${userRole}') RETURNING id, username, role`;
        console.log('Executing Register Query:', query);
        const result = await db.query(query);
        const user = result.rows[0];

        // Create profile based on role
        if (userRole === 'patient') {
            await db.query(`INSERT INTO patients (user_id, name, dob, address) VALUES (${user.id}, '${name}', '${dob}', '${address}')`);
        } else if (userRole === 'doctor') {
            await db.query(`INSERT INTO doctors (user_id, name, specialty) VALUES (${user.id}, '${name}', '${specialty}')`);
        } else if (userRole === 'nurse') {
            await db.query(`INSERT INTO nurses (user_id, name) VALUES (${user.id}, '${name}')`);
        }

        res.status(201).json(user);
    } catch (err) {
        next(err);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const passwordHash = md5(password);

        // WARNING: intentionally vulnerable SQL injection
        const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${passwordHash}'`;
        console.log('Executing Login Query:', query);
        const result = await db.query(query);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            // Return user info directly, client stores it
            res.json({
                message: 'Login successful',
                user: { id: user.id, username: user.username, role: user.role }
            });
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
        // WARNING: No old password check enforced strongly, relying on client to send username
        const passwordHash = md5(newPassword);
        const query = `UPDATE users SET password = '${passwordHash}' WHERE username = '${username}'`;
        await db.query(query);
        res.json({ message: 'Password updated' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
