import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { updatePatientNotes } from '../api';

function PatientEdit() {
    const { id } = useParams();
    const [notes, setNotes] = useState('');
    const navigate = useNavigate();

    const handleSave = async () => {
        await updatePatientNotes(id, notes);
        navigate('/patients');
    };

    return (
        <div>
            <h2>Edit Patient Notes</h2>
            <p>ID: {id}</p>
            <textarea
                rows="5"
                cols="50"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Enter new notes (HTML allowed)..."
            />
            <br />
            <button onClick={handleSave}>Save Notes</button>
        </div>
    );
}

export default PatientEdit;
