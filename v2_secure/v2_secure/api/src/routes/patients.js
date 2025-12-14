const express = require('express');
const router = express.Router();
const db = require('../db');

const { authenticate, authorize } = require('../middleware/auth');
const { logEvent } = require('../utils/audit');

// List all patients (Admin/Doctor/Nurse only)
router.get('/', authenticate, authorize(['admin', 'doctor', 'nurse']), async (req, res, next) => {
    try {
        const query = "SELECT * FROM patients";
        const result = await db.query(query);
        await logEvent('VIEW_ALL_PATIENTS', req.user.id, { count: result.rows.length });
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

// Search patients (Admin/Doctor/Nurse only)
router.get('/search', authenticate, authorize(['admin', 'doctor', 'nurse']), async (req, res, next) => {
    try {
        const { q } = req.query;
        const query = 'SELECT * FROM patients WHERE name LIKE $1';
        const result = await db.query(query, [`%${q}%`]);
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

// Get patient appointments (IDOR Protected)
router.get('/:id/appointments', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        // IDOR Check: Users can only see their own appointments unless they are medical staff
        if (req.user.role === 'patient' && req.user.id !== parseInt(id)) {
            await logEvent('IDOR_ATTEMPT', req.user.id, { target: id, resource: 'appointments' });
            return res.status(403).json({ error: 'Forbidden' });
        }

        const query = `
      SELECT a.*, d.name as doctor_name, 
             diag.description as diagnosis, 
             med.drug_name, med.dosage
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.user_id
      LEFT JOIN diagnoses diag ON a.id = diag.appointment_id
      LEFT JOIN medications med ON a.id = med.appointment_id
      WHERE a.patient_id = $1
    `;
        const result = await db.query(query, [id]);
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

// Apply for appointment (IDOR Protected)
router.post('/appointments', authenticate, authorize(['patient']), async (req, res, next) => {
    try {
        const { doctorId, reason } = req.body;
        // Securely use ID from token, ignore body ID
        const patientId = req.user.id;

        const query = 'INSERT INTO appointments (patient_id, doctor_id, status, reason) VALUES ($1, $2, \'pending\', $3) RETURNING *';
        const result = await db.query(query, [patientId, doctorId, reason]);
        await logEvent('CREATE_APPOINTMENT', req.user.id, { doctorId });
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
