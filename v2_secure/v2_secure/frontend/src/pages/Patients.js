import React, { useEffect, useState } from 'react';
import { getPatients, searchPatients } from '../api';
import { Link } from 'react-router-dom';

function Patients() {
    const [patients, setPatients] = useState([]);
    const [query, setQuery] = useState('');
    const [searchMsg, setSearchMsg] = useState('');

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        const data = await getPatients();
        setPatients(data);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        // WARNING: Reflected XSS vulnerability
        // We display the query back to the user without sanitization
        setSearchMsg(`Results for: ${query}`);

        const data = await searchPatients(query);
        setPatients(data);
    };

    return (
        <div>
            <h2>Patient Records</h2>
            <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
                <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search by name..."
                />
                <button type="submit">Search</button>
            </form>

            {searchMsg && (
                <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>{searchMsg}</div>
            )}

            <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>DOB</th>
                        <th>Diagnosis</th>
                        <th>Notes</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {patients.map(p => (
                        <tr key={p.id}>
                            <td>{p.name}</td>
                            <td>{p.dob}</td>
                            <td>{p.diagnosis}</td>
                            <td>{p.notes}</td>
                            <td>
                                <Link to={`/patients/${p.id}`}>Edit</Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Patients;
