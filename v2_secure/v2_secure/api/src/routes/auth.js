const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const config = require('../config');
const { logEvent } = require('../utils/audit');
const { JWT_SECRET, authenticate } = require('../middleware/auth');
const { encrypt, decrypt } = require('../utils/encryption');

// Email Transporter
const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port == 465, // true for 465 (SSL), false for other ports (TLS/STARTTLS)
    auth: {
        user: config.email.user,
        pass: config.email.pass,
    },
});

// Validation Middleware
const validateRegister = [
    body('username').trim().isLength({ min: 3 }).escape(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('email').isEmail().normalizeEmail(),
    body('role').isIn(['patient', 'doctor', 'nurse', 'admin']).optional(),
];

const validateLogin = [
    body('username').trim().notEmpty(),
    body('password').notEmpty(),
];

router.post('/register', validateRegister, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password, role, email, name, dob, address, specialty } = req.body;
        const userRole = role || 'patient';

        // Check if user exists
        const checkQuery = 'SELECT id FROM users WHERE username = $1 OR email = $2';
        const checkResult = await db.query(checkQuery, [username, email]);
        if (checkResult.rows.length > 0) {
            return res.status(400).json({ error: 'Username or Email already exists' });
        }

        // ...

        // ...

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Encrypt Sensitive Data
        const encryptedEmail = encrypt(email);
        const encryptedAddress = address ? encrypt(address) : null;

        // Insert User
        const query = 'INSERT INTO users (username, password, role, email) VALUES ($1, $2, $3, $4) RETURNING id, username, role';
        const result = await db.query(query, [username, passwordHash, userRole, encryptedEmail]);
        const user = result.rows[0];

        // Create Profile
        if (userRole === 'patient') {
            await db.query('INSERT INTO patients (user_id, name, dob, address) VALUES ($1, $2, $3, $4)', [user.id, name, dob, encryptedAddress]);
        } else if (userRole === 'doctor') {
            await db.query('INSERT INTO doctors (user_id, name, specialty) VALUES ($1, $2, $3)', [user.id, name, specialty]);
        } else if (userRole === 'nurse') {
            await db.query('INSERT INTO nurses (user_id, name) VALUES ($1, $2)', [user.id, name]);
        }

        await logEvent('REGISTER', user.id, { role: userRole });
        res.status(201).json({ id: user.id, username: user.username, role: user.role });
    } catch (err) {
        next(err);
    }
});

router.get('/me', authenticate, (req, res) => {
    res.json(req.user);
});

router.post('/login', validateLogin, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        const query = 'SELECT id, username, password, email, role, otp_expires, otp_hash FROM users WHERE username = $1';
        const result = await db.query(query, [username]);

        // ...
        // ...
        // ...

        if (result.rows.length > 0) {
            const user = result.rows[0];
            const match = await bcrypt.compare(password, user.password);

            if (!match) {
                await logEvent('LOGIN_FAILED', null, { username, reason: 'Invalid Password' });
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpHash = await bcrypt.hash(otp, 10);
            const expires = new Date(Date.now() + 10 * 60000); // 10 mins

            // Store OTP
            await db.query('UPDATE users SET otp_hash = $1, otp_expires = $2 WHERE id = $3', [otpHash, expires, user.id]);


            // Decrypt Email

            const decryptedEmail = decrypt(user.email); // Decrypt email for use

            // Send Email
            try {
                if (config.email.user !== 'user@example.com') {
                    console.log(`[AUTH] Sending OTP for ${username} to ${decryptedEmail}`);
                    await transporter.sendMail({
                        from: config.email.user,
                        to: decryptedEmail, // Use decrypted email
                        subject: 'Your Login Validation Code',
                        text: `Your code is: ${otp}`,
                    });
                    console.log(`[AUTH] OTP sent to ${decryptedEmail}`);
                } else {
                    console.log(`[DEV] OTP for ${username}: ${otp}`);
                }
            } catch (emailErr) {
                console.error('[AUTH] Email failed', emailErr);
                return res.status(500).json({ error: 'Failed to send OTP email' });
            }

            await logEvent('2FA_GENERATED', user.id, { method: 'email' });
            res.json({ message: 'OTP sent to email', mfaRequired: true, username: user.username });
        } else {
            await logEvent('LOGIN_FAILED', null, { username, reason: 'User not found' });
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        next(err);
    }
});

router.post('/verify-otp', async (req, res, next) => {
    try {
        const { username, otp } = req.body;

        if (!username || !otp) {
            return res.status(400).json({ error: 'Username and OTP are required' });
        }

        const result = await db.query('SELECT id, username, role, otp_expires, otp_hash FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid request' });

        const user = result.rows[0];

        // Check Expiry
        if (new Date() > new Date(user.otp_expires)) {
            return res.status(401).json({ error: 'OTP Expired' });
        }

        // Check Hash
        const match = await bcrypt.compare(otp, user.otp_hash || '');
        if (!match) {
            await logEvent('MFA_FAILED', user.id, {});
            return res.status(401).json({ error: 'Invalid OTP' });
        }

        // Success: Clear OTP and Issue Token
        await db.query('UPDATE users SET otp_hash = NULL, otp_expires = NULL WHERE id = $1', [user.id]);

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '30m' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 30 * 60 * 1000 // 30 mins
        });

        await logEvent('LOGIN_SUCCESS', user.id, { role: user.role });
        res.json({
            message: 'Login successful',
            user: { id: user.id, username: user.username, role: user.role }
        });

    } catch (err) {
        next(err);
    }
});

router.post('/logout', (req, res) => {
    // Audit logout? Optional but good practice.
    // Since stateless/cookie, we can't easily track *who* unless we decode token first, 
    // but clearing cookie is enough.
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
