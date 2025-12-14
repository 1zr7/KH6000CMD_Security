const express = require('express');
const router = express.Router();
const db = require('../db');

const { authenticate, authorize } = require('../middleware/auth');
const { logEvent } = require('../utils/audit');

// Write medication (Nurse/Admin only)
router.post('/appointments/:id/medication', authenticate, authorize(['nurse', 'admin']), async (req, res, next) => {
    try {
        const { id } = req.params;
        let { nurseId, patientId, drugName, dosage } = req.body;

        // Force nurseId to be the logged in user if they are a nurse
        if (req.user.role === 'nurse') {
            nurseId = req.user.id;
        }

        if (!drugName || !dosage || !patientId) {
            return res.status(400).json({ error: 'Missing medication details' });
        }

        const query = 'INSERT INTO medications (appointment_id, nurse_id, patient_id, drug_name, dosage) VALUES ($1, $2, $3, $4, $5) RETURNING *';
        const result = await db.query(query, [id, nurseId, patientId, drugName, dosage]);
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// Delete medication (Nurse/Admin only)
router.delete('/medications/:id', authenticate, authorize(['nurse', 'admin']), async (req, res, next) => {
    try {
        const { id } = req.params;
        if (isNaN(parseInt(id))) return res.status(400).json({ error: 'Invalid ID' });
        const query = 'DELETE FROM medications WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// Get nurse's assigned doctors and their appointments (IDOR Protected)
router.get('/:nurseId/appointments', authenticate, authorize(['nurse', 'admin']), async (req, res, next) => {
    try {
        const { nurseId } = req.params;
        if (isNaN(parseInt(nurseId))) return res.status(400).json({ error: 'Invalid Nurse ID' });
        if (req.user.role === 'nurse' && req.user.id !== parseInt(nurseId)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
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
