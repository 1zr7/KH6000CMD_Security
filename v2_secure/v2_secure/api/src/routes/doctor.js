const express = require('express');
const router = express.Router();
const db = require('../db');

// Assign nurse to doctor
router.post('/:doctorId/assign-nurse', async (req, res, next) => {
    try {
        const { doctorId } = req.params;
        const { nurseId } = req.body;
        // WARNING: SQL Injection
        const query = 'UPDATE doctors SET assigned_nurse_id = $1 WHERE user_id = $2';
        await db.query(query, [nurseId, doctorId]);
        res.json({ message: 'Nurse assigned', doctorId, nurseId });
    } catch (err) {
        next(err);
    }
});

// Assign patient (create appointment as 'assigned' or just link)
// For this spec, we'll create an appointment with status 'assigned' to represent the link
router.post('/:doctorId/assign-patient', async (req, res, next) => {
    try {
        const { doctorId } = req.params;
        const { patientId } = req.body;
        // WARNING: SQL Injection
        const query = 'INSERT INTO appointments (patient_id, doctor_id, status, reason) VALUES ($1, $2, $3, $4) RETURNING *';
        const result = await db.query(query, [patientId, doctorId, 'assigned', 'Doctor assigned']);
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// Write diagnosis
router.post('/appointments/:id/diagnosis', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { doctorId, description } = req.body;
        // WARNING: SQL Injection
        const query = 'INSERT INTO diagnoses (appointment_id, doctor_id, description) VALUES ($1, $2, $3) RETURNING *';
        const result = await db.query(query, [id, doctorId, description]);

        // Also update appointment status
        await db.query('UPDATE appointments SET status = $1 WHERE id = $2', ['completed', id]);

        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// Accept appointment
router.put('/appointments/:id/accept', async (req, res, next) => {
    try {
        const { id } = req.params;
        // WARNING: SQL Injection
        const query = 'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *';
        const result = await db.query(query, ['accepted', id]);
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// Get doctor's appointments
router.get('/:doctorId/appointments', async (req, res, next) => {
    try {
        const { doctorId } = req.params;
        const query = `
      SELECT a.*, p.name as patient_name 
      FROM appointments a 
      JOIN patients p ON a.patient_id = p.user_id 
      WHERE a.doctor_id = $1
    `;
        const result = await db.query(query, [doctorId]);
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
