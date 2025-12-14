import React, { useEffect, useState } from 'react';
import { getPatients, searchPatients, getPatientAppointments } from '../api';

function PatientsList() {
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
        <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-white">Patient Directory</h2>

            <div className="card">
                <form onSubmit={handleSearch} className="flex gap-4 mb-6">
                    <div className="flex-1">
                        <input
                            className="input-field rounded-full"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search patients (Try ' OR '1'='1)..."
                        />
                    </div>
                    <button type="submit" className="btn btn-primary rounded-full px-6">Search</button>
                </form>

                {searchMsg && (
                    <div className="bg-blue-900/30 border border-blue-800 p-4 rounded mb-4 text-blue-200">
                        <span dangerouslySetInnerHTML={{ __html: searchMsg }} />
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-800">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">DOB</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Address</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-900 divide-y divide-gray-800">
                            {patients.map(p => (
                                <React.Fragment key={p.id}>
                                    <tr
                                        onClick={() => toggleRow(p.id)}
                                        className="cursor-pointer hover:bg-gray-800 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{p.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-400">{p.dob}</td>
                                        <td className="px-6 py-4 text-gray-400">{p.address}</td>
                                    </tr>
                                    {expandedRow === p.id && (
                                        <tr className="bg-gray-800/30">
                                            <td colSpan="3" className="px-6 py-4">
                                                <div className="pl-4 border-l-2 border-brand-green">
                                                    <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wide">Appointment History</h4>
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

export default PatientsList;
