const express = require('express');
const router = express.Router();
const db = require('../db');

// Write medication
router.post('/appointments/:id/medication', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nurseId, patientId, drugName, dosage } = req.body;
        // WARNING: SQL Injection
        const query = `INSERT INTO medications (appointment_id, nurse_id, patient_id, drug_name, dosage) VALUES (${id}, ${nurseId}, ${patientId}, '${drugName}', '${dosage}') RETURNING *`;
        const result = await db.query(query);
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// Delete medication
router.delete('/medications/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        // WARNING: SQL Injection
        const query = `DELETE FROM medications WHERE id = ${id} RETURNING *`;
        const result = await db.query(query);
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
        const docQuery = `SELECT user_id FROM doctors WHERE assigned_nurse_id = ${nurseId}`;
        const docs = await db.query(docQuery);

        if (docs.rows.length === 0) return res.json([]);

        const doctorIds = docs.rows.map(d => d.user_id).join(',');
        const query = `
      SELECT a.*, p.name as patient_name, p.id as patient_profile_id, d.name as doctor_name, diag.id as diagnosis_id, diag.description as diagnosis_description,
             COALESCE(json_agg(json_build_object('id', m.id, 'drug_name', m.drug_name, 'dosage', m.dosage)) FILTER (WHERE m.id IS NOT NULL), '[]') as medications
      FROM appointments a 
      JOIN patients p ON a.patient_id = p.user_id 
      JOIN doctors d ON a.doctor_id = d.user_id
      LEFT JOIN diagnoses diag ON a.id = diag.appointment_id
      LEFT JOIN medications m ON a.id = m.appointment_id
      WHERE a.doctor_id IN (${doctorIds})
      GROUP BY a.id, p.name, p.id, d.name, diag.id, diag.description
    `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
