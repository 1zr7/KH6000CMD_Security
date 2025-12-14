import React, { useEffect, useState } from 'react';
import { getPatients, searchPatients, getPatientAppointments } from '../api';
import { Link } from 'react-router-dom';

function Patients() {
    const [patients, setPatients] = useState([]);
    const [query, setQuery] = useState('');
    const [searchMsg, setSearchMsg] = useState('');
    const [expandedRow, setExpandedRow] = useState(null);
    const [expandedAppointments, setExpandedAppointments] = useState(null);

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        const data = await getPatients();
        setPatients(data);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setSearchMsg(`Results for: ${query}`);
        const data = await searchPatients(query);
        setPatients(data);
    };

    const toggleRow = async (patientId) => {
        if (expandedRow === patientId) {
            setExpandedRow(null);
            setExpandedAppointments(null);
        } else {
            setExpandedRow(patientId);
            try {
                const apps = await getPatientAppointments(patientId);
                setExpandedAppointments(apps);
            } catch (err) {
                console.error("Failed to fetch appointments", err);
                setExpandedAppointments([]);
            }
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h2 className="text-3xl font-bold mb-8 text-brand-green">Patient Directory</h2>

            <form onSubmit={handleSearch} className="mb-8 flex gap-4">
                <input
                    className="input-field flex-1"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search by name..."
                />
                <button type="submit" className="btn btn-primary">Search</button>
            </form>

            {searchMsg && (
                <div className="mb-4 text-brand-green font-mono">
                    {searchMsg}
                </div>
            )}

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead>
                            <tr className="bg-gray-800">
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">DOB</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Diagnosis</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Notes</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700 text-gray-300">
                            {patients.map(p => (
                                <React.Fragment key={p.id}>
                                    <tr
                                        onClick={() => toggleRow(p.id)}
                                        className="hover:bg-gray-800/50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4 font-semibold text-white">{p.name}</td>
                                        <td className="px-6 py-4">{p.dob}</td>
                                        <td className="px-6 py-4">{p.diagnosis || 'N/A'}</td>
                                        <td className="px-6 py-4 max-w-xs truncate" dangerouslySetInnerHTML={{ __html: p.notes }}></td>
                                        <td className="px-6 py-4">
                                            <Link
                                                to={`/patients/${p.id}`}
                                                className="text-brand-green hover:text-brand-green-dark"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                    {expandedRow === p.id && (
                                        <tr className="bg-gray-800/30">
                                            <td colSpan="5" className="px-6 py-4">
                                                <div className="pl-4 border-l-2 border-brand-green">
                                                    <h4 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Appointment History</h4>
                                                    {expandedAppointments && expandedAppointments.length > 0 ? (
                                                        <div className="space-y-3">
                                                            {expandedAppointments.map((app, idx) => (
                                                                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-gray-900/50 p-3 rounded">
                                                                    <div>
                                                                        <span className="text-gray-500 block text-xs">Date</span>
                                                                        <span className="text-gray-200">{app.date_time ? new Date(app.date_time).toLocaleString() : 'N/A'}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-500 block text-xs">Doctor</span>
                                                                        <span className="text-brand-green">{app.doctor_name || 'N/A'}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-500 block text-xs">Diagnosis</span>
                                                                        <span className="text-gray-200">{app.diagnosis || 'None'}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 italic">No appointment history found.</p>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Patients;
