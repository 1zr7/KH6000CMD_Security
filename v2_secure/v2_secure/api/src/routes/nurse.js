const express = require('express');
const router = express.Router();
const db = require('../db');

// Write medication
router.post('/appointments/:id/medication', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nurseId, patientId, drugName, dosage } = req.body;
        // WARNING: SQL Injection
        const query = 'INSERT INTO medications (appointment_id, nurse_id, patient_id, drug_name, dosage) VALUES ($1, $2, $3, $4, $5) RETURNING *';
        const result = await db.query(query, [id, nurseId, patientId, drugName, dosage]);
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// Get nurse's assigned doctors and their appointments
// Simplified: Just get all appointments for doctors assigned to this nurse
router.get('/:nurseId/appointments', async (req, res, next) => {
    try {
        const { nurseId } = req.params;
        // Find doctors assigned to this nurse
        const docQuery = 'SELECT user_id FROM doctors WHERE assigned_nurse_id = $1';
        const docs = await db.query(docQuery, [nurseId]);

        if (docs.rows.length === 0) return res.json([]);

        const doctorIds = docs.rows.map(d => d.user_id);
        const query = `
      SELECT a.*, p.name as patient_name, d.name as doctor_name
      FROM appointments a 
      JOIN patients p ON a.patient_id = p.user_id 
      JOIN doctors d ON a.doctor_id = d.user_id
      WHERE a.doctor_id = ANY($1::int[])
    `;
        const result = await db.query(query, [doctorIds]);
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
