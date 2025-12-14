const express = require('express');
const router = express.Router();
const db = require('../db');

// Get doctor details
router.get('/:doctorId/details', async (req, res, next) => {
    try {
        const { doctorId } = req.params;
        const query = `
            SELECT d.*, u.username as nurse_username, n.name as nurse_name
            FROM doctors d
            LEFT JOIN users u ON d.assigned_nurse_id = u.id
            LEFT JOIN nurses n ON u.id = n.user_id
            WHERE d.user_id = $1
        `;
        const result = await db.query(query, [doctorId]);
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// Assign nurse to doctor
router.post('/:doctorId/assign-nurse', async (req, res, next) => {
    try {
        const { doctorId } = req.params;
        const { nurseId } = req.body;
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
        const query = 'INSERT INTO appointments (patient_id, doctor_id, status, reason) VALUES ($1, $2, \'assigned\', \'Doctor assigned\') RETURNING *';
        const result = await db.query(query, [patientId, doctorId]);
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// Write or Update diagnosis
router.post('/appointments/:id/diagnosis', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { doctorId, description } = req.body;

        // Check if diagnosis exists
        const checkQuery = 'SELECT * FROM diagnoses WHERE appointment_id = $1';
        const checkResult = await db.query(checkQuery, [id]);

        let result;
        if (checkResult.rows.length > 0) {
            // Update
            const query = 'UPDATE diagnoses SET description = $1 WHERE appointment_id = $2 RETURNING *';
            result = await db.query(query, [description, id]);
        } else {
            // Insert
            const query = 'INSERT INTO diagnoses (appointment_id, doctor_id, description) VALUES ($1, $2, $3) RETURNING *';
            result = await db.query(query, [id, doctorId, description]);
        }

        // Also update appointment status
        await db.query('UPDATE appointments SET status = \'completed\' WHERE id = $1', [id]);

        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// Accept appointment
router.put('/appointments/:id/accept', async (req, res, next) => {
    try {
        const { id } = req.params;
        const query = 'UPDATE appointments SET status = \'accepted\' WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// Reject appointment
router.put('/appointments/:id/reject', async (req, res, next) => {
    try {
        const { id } = req.params;
        const query = 'UPDATE appointments SET status = \'rejected\' WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);
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
      SELECT a.*, p.name as patient_name, p.id as patient_profile_id, d.id as diagnosis_id, d.description as diagnosis_description, doc.name as doctor_name,
             COALESCE(json_agg(json_build_object('id', m.id, 'drug_name', m.drug_name, 'dosage', m.dosage)) FILTER (WHERE m.id IS NOT NULL), '[]') as medications
      FROM appointments a 
      JOIN patients p ON a.patient_id = p.user_id 
      LEFT JOIN doctors doc ON a.doctor_id = doc.user_id
      LEFT JOIN diagnoses d ON a.id = d.appointment_id
      LEFT JOIN medications m ON a.id = m.appointment_id
      WHERE a.doctor_id = $1
      GROUP BY a.id, p.name, p.id, d.id, d.description, doc.name
    `;
        const result = await db.query(query, [doctorId]);
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
