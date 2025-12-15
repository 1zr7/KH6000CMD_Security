const express = require('express');
const router = express.Router();
const db = require('../db');

const { authenticate, authorize } = require('../middleware/auth');
const { logEvent } = require('../utils/audit');

router.get('/nurses', authenticate, authorize(['doctor', 'admin']), async (req, res, next) => {
    try {
        console.log('[DEBUG_NURSES] Fetching nurses...');
        const result = await db.query("SELECT id, username FROM users WHERE role = 'nurse'");
        console.log(`[DEBUG_NURSES] Found ${result.rows.length} nurses`);
        res.json(result.rows);
    } catch (err) {
        console.error('[DEBUG_NURSES] Error:', err);
        next(err);
    }
});

// Get doctor details (IDOR Protected)
router.get('/:doctorId/details', authenticate, authorize(['doctor', 'admin']), async (req, res, next) => {
    try {
        const { doctorId } = req.params;
        if (isNaN(parseInt(doctorId))) return res.status(400).json({ error: 'Invalid Doctor ID' });
        // ... (rest of details route)
        // ...
        await logEvent('PHI_ACCESS', req.user.id, { target: 'doctor_profile', targetId: doctorId });

        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// Assign nurse to doctor (Admin or Doctor)
router.post('/:doctorId/assign-nurse', authenticate, async (req, res, next) => {
    try {
        console.log(`[DEBUG_ASSIGN] User: ${JSON.stringify(req.user)}`);

        // Manual Authz Check
        const allowedRoles = ['admin', 'doctor'];
        if (!allowedRoles.includes(req.user.role)) {
            console.log(`[DEBUG_ASSIGN] Role mismatch. User: ${req.user.role}, Allowed: ${allowedRoles}`);
            return res.status(403).json({ error: `Forbidden: Insufficient rights (Manual Check). You are ${req.user.role}` });
        }
        const { doctorId } = req.params;
        const { nurseId } = req.body;
        // Validate IDs
        if (!nurseId || isNaN(parseInt(nurseId))) return res.status(400).json({ error: 'Invalid nurseId' });

        console.log(`[ASSIGN NURSE] User: ${req.user.username} (${req.user.id}/${req.user.role}) trying to assign to DoctorID: ${doctorId}`);

        // IDOR Check: Doctors can only assign to themselves
        if (req.user.role === 'doctor' && req.user.id !== parseInt(doctorId)) {
            console.log(`[ASSIGN NURSE] IDOR Blocked. UserID ${req.user.id} != TargetID ${doctorId}`);
            return res.status(403).json({ error: 'Forbidden' });
        }

        const query = 'UPDATE doctors SET assigned_nurse_id = $1 WHERE user_id = $2';
        await db.query(query, [nurseId, doctorId]);
        res.json({ message: 'Nurse assigned', doctorId, nurseId });
    } catch (err) {
        next(err);
    }
});

// Assign patient (create appointment as 'assigned' or just link)
// For this spec, we'll create an appointment with status 'assigned' to represent the link
router.post('/:doctorId/assign-patient', authenticate, authorize(['doctor', 'admin']), async (req, res, next) => {
    try {
        const { doctorId } = req.params;
        const { patientId } = req.body;

        // IDOR Check
        if (req.user.role === 'doctor' && req.user.id !== parseInt(doctorId)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (!patientId || isNaN(parseInt(patientId))) {
            return res.status(400).json({ error: 'Invalid Patient ID' });
        }

        const query = 'INSERT INTO appointments (patient_id, doctor_id, status, reason) VALUES ($1, $2, \'assigned\', \'Doctor assigned\') RETURNING *';
        const result = await db.query(query, [patientId, doctorId]);
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

const { encrypt, decrypt } = require('../utils/encryption');

// Write or Update diagnosis
router.post('/appointments/:id/diagnosis', authenticate, authorize(['doctor']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { description } = req.body;
        const doctorId = req.user.id; // Use authenticated ID

        if (!description || typeof description !== 'string' || description.trim() === '') {
            return res.status(400).json({ error: 'Description is required' });
        }

        // Verify appointment belongs to doctor
        const apptQuery = 'SELECT * FROM appointments WHERE id = $1 AND doctor_id = $2';
        const apptResult = await db.query(apptQuery, [id, doctorId]);

        if (apptResult.rows.length === 0) {
            return res.status(403).json({ error: 'Forbidden: Appointment not found or not yours' });
        }

        // Check if diagnosis exists
        const checkQuery = 'SELECT * FROM diagnoses WHERE appointment_id = $1';
        const checkResult = await db.query(checkQuery, [id]);

        const encryptedDescription = encrypt(description);

        let result;
        if (checkResult.rows.length > 0) {
            // Update
            const query = 'UPDATE diagnoses SET description = $1 WHERE appointment_id = $2 RETURNING *';
            result = await db.query(query, [encryptedDescription, id]);
        } else {
            // Insert
            const query = 'INSERT INTO diagnoses (appointment_id, doctor_id, description) VALUES ($1, $2, $3) RETURNING *';
            result = await db.query(query, [id, doctorId, encryptedDescription]);
        }

        // Decrypt for response
        if (result.rows[0]) {
            result.rows[0].description = decrypt(result.rows[0].description);
        }

        // Also update appointment status
        await db.query('UPDATE appointments SET status = \'completed\' WHERE id = $1', [id]);
        await logEvent('DIAGNOSIS_UPDATED', req.user.id, { appointmentId: id });

        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// Accept appointment
router.put('/appointments/:id/accept', authenticate, authorize(['doctor']), async (req, res, next) => {
    try {
        const { id } = req.params;
        // Verify ownership
        const appt = await db.query('SELECT * FROM appointments WHERE id = $1 AND doctor_id = $2', [id, req.user.id]);
        if (appt.rows.length === 0) return res.status(403).json({ error: 'Forbidden' });

        const query = 'UPDATE appointments SET status = \'accepted\' WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// Reject appointment
router.put('/appointments/:id/reject', authenticate, authorize(['doctor']), async (req, res, next) => {
    try {
        const { id } = req.params;
        // Verify ownership
        const appt = await db.query('SELECT * FROM appointments WHERE id = $1 AND doctor_id = $2', [id, req.user.id]);
        if (appt.rows.length === 0) return res.status(403).json({ error: 'Forbidden' });

        const query = 'UPDATE appointments SET status = \'rejected\' WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// Get doctor's appointments (IDOR Protected)
router.get('/:doctorId/appointments', authenticate, authorize(['doctor', 'admin']), async (req, res, next) => {
    try {
        const { doctorId } = req.params;
        if (isNaN(parseInt(doctorId))) return res.status(400).json({ error: 'Invalid Doctor ID' });
        if (req.user.role === 'doctor' && req.user.id !== parseInt(doctorId)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
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

        // Decrypt diagnoses
        const decryptedRows = result.rows.map(row => ({
            ...row,
            diagnosis_description: row.diagnosis_description ? decrypt(row.diagnosis_description) : row.diagnosis_description
        }));

        res.json(decryptedRows);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
