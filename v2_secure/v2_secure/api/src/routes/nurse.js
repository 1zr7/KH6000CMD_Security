const express = require('express');
const router = express.Router();
const db = require('../db');

// Write medication
router.post('/appointments/:id/medication', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nurseId, patientId, drugName, dosage } = req.body;
        const query = 'INSERT INTO medications (appointment_id, nurse_id, patient_id, drug_name, dosage) VALUES ($1, $2, $3, $4, $5) RETURNING *';
        const result = await db.query(query, [id, nurseId, patientId, drugName, dosage]);
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// Delete medication
router.delete('/medications/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const query = 'DELETE FROM medications WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// Get nurse's assigned doctors and their appointments
router.get('/:nurseId/appointments', async (req, res, next) => {
    try {
        const { nurseId } = req.params;
        // Find appointments via join to avoid two steps and potential SQLi with array joining
        const query = `
      SELECT a.*, p.name as patient_name, p.id as patient_profile_id, d.name as doctor_name, diag.id as diagnosis_id, diag.description as diagnosis_description,
             COALESCE(json_agg(json_build_object('id', m.id, 'drug_name', m.drug_name, 'dosage', m.dosage)) FILTER (WHERE m.id IS NOT NULL), '[]') as medications
      FROM appointments a 
      JOIN patients p ON a.patient_id = p.user_id 
      JOIN doctors d ON a.doctor_id = d.user_id
      LEFT JOIN diagnoses diag ON a.id = diag.appointment_id
      LEFT JOIN medications m ON a.id = m.appointment_id
      WHERE d.assigned_nurse_id = $1
      GROUP BY a.id, p.name, p.id, d.name, diag.id, diag.description
    `;
        const result = await db.query(query, [nurseId]);
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
