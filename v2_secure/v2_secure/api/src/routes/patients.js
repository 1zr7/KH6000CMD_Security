const express = require('express');
const router = express.Router();
const db = require('../db');

// List all patients (vulnerable, shows all)
router.get('/', async (req, res, next) => {
    try {
        const query = "SELECT * FROM patients";
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

// Search patients
router.get('/search', async (req, res, next) => {
    try {
        const { q } = req.query;
        // WARNING: SQL Injection
        const query = 'SELECT * FROM patients WHERE name ILIKE $1';
        const result = await db.query(query, ['%' + q + '%']);
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

// Get patient appointments with details
router.get('/:id/appointments', async (req, res, next) => {
    try {
        const { id } = req.params;
        // WARNING: SQL Injection
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

// Apply for appointment
router.post('/appointments', async (req, res, next) => {
    try {
        const { patientId, doctorId, reason } = req.body;
        // WARNING: SQL Injection
        const query = 'INSERT INTO appointments (patient_id, doctor_id, status, reason) VALUES ($1, $2, $3, $4) RETURNING *';
        const result = await db.query(query, [patientId, doctorId, 'pending', reason]);
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
