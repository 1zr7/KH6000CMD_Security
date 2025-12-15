import React, { useState, useEffect } from 'react';
import { getUsers, assignNurse, assignPatient, getDoctorAppointments, acceptAppointment, rejectAppointment, createDiagnosis, getDoctorDetails, getNurses } from '../api';

function DoctorDashboard({ user }) {
    const [appointments, setAppointments] = useState([]);
    const [users, setUsers] = useState([]);
    const [nurses, setNurses] = useState([]);
    const [selectedNurse, setSelectedNurse] = useState('');
    const [selectedPatient, setSelectedPatient] = useState('');
    const [diagnosis, setDiagnosis] = useState({});
    const [currentNurse, setCurrentNurse] = useState(null);
    const [lastResponse, setLastResponse] = useState(null);
    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const apps = await getDoctorAppointments(user.id);
            const details = await getDoctorDetails(user.id);

            if (Array.isArray(apps)) {
                setAppointments(apps);
                // Pre-fill diagnosis state
                const diagState = {};
                apps.forEach(a => {
                    if (a.status === 'completed' && a.diagnosis_description) {
                        diagState[a.id] = a.diagnosis_description;
                    }
                });
                setDiagnosis(prev => ({ ...prev, ...diagState }));
            }

            if (details && details.nurse_name) {
                setCurrentNurse(details.nurse_name);
            } else {
                setCurrentNurse(null);
            }

            try {
                const allUsers = await getUsers();
                if (Array.isArray(allUsers)) {
                    setUsers(allUsers);
                }
            } catch (e) {
                console.error("Failed to fetch users (non-critical):", e);
            }

            try {
                const allNurses = await getNurses();
                console.log('Fetched Nurses:', allNurses);
                if (Array.isArray(allNurses)) {
                    setNurses(allNurses);
                } else {
                    console.error('Nurses response is not an array:', allNurses);
                }
            } catch (e) {
                console.error("Failed to fetch nurses:", e);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    };

    const handleAssignNurse = async () => {
        const res = await assignNurse(user.id, selectedNurse);
        setLastResponse(res);
        loadData();
    };

    const handleAssignPatient = async () => {
        const res = await assignPatient(user.id, selectedPatient);
        setLastResponse(res);
        loadData();
    };

    const handleAccept = async (id) => {
        const res = await acceptAppointment(id);
        setLastResponse(res);
        loadData();
    };

    const handleReject = async (id) => {
        const res = await rejectAppointment(id);
        setLastResponse(res);
        loadData();
    };

    const handleDiagnosis = async (id) => {
        const res = await createDiagnosis(id, user.id, diagnosis[id]);
        setLastResponse(res);
        loadData();
    };

    return (
        <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Doctor Dashboard (v2)</h2>
            <div className="text-xs text-gray-500 mb-4">Debug: Me={user.username} ({user.role}) ID={user.id}</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Assign Nurse</h3>
                    {currentNurse && (
                        <div className="mb-4 p-2 bg-brand-green/10 rounded border border-brand-green/20">
                            <p className="text-sm text-gray-300">Current Nurse:</p>
                            <p className="text-brand-green font-bold">{currentNurse}</p>
                        </div>
                    )}
                    <select className="input-field mb-2" onChange={e => setSelectedNurse(e.target.value)}>
                        <option value="">Select Nurse</option>
                        {Array.isArray(nurses) && nurses.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                    </select>
                    <button onClick={handleAssignNurse} disabled={!selectedNurse} className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">Assign</button>
                </div>
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Assign Patient</h3>
                    <select className="input-field mb-2" onChange={e => setSelectedPatient(e.target.value)}>
                        <option value="">Select Patient</option>
                        {Array.isArray(users) && users.filter(u => u.role === 'patient').map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                    </select>
                    <button onClick={handleAssignPatient} disabled={!selectedPatient} className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">Assign</button>
                </div>
            </div>

            <div className="card">
                <h3 className="text-lg font-semibold mb-4">Appointments</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-gray-700">
                            {Array.isArray(appointments) && appointments.length > 0 ? (
                                appointments.map(app => (
                                    <React.Fragment key={app.id}>
                                        <tr
                                            onClick={() => setExpandedRow(expandedRow === app.id ? null : app.id)}
                                            className="cursor-pointer hover:bg-gray-800 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{app.patient_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${app.status === 'completed' ? 'bg-brand-green/20 text-brand-green' : app.status === 'rejected' ? 'bg-red-900/30 text-red-500' : 'bg-yellow-900/30 text-yellow-500'}`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">{app.reason}</td>
                                            <td className="px-6 py-4 space-y-2">
                                                {app.medications && app.medications.length > 0 && (
                                                    <div className="mb-2 space-y-1">
                                                        {app.medications.map((med, idx) => (
                                                            <div key={idx} className="p-1 bg-brand-green/10 rounded border border-brand-green/20 text-xs text-brand-green">
                                                                Med: {med.drug_name} ({med.dosage})
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {app.status === 'pending' && (
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <button onClick={() => handleAccept(app.id)} className="text-brand-green hover:text-brand-green-dark mr-4">Accept</button>
                                                        <button onClick={() => handleReject(app.id)} className="text-red-500 hover:text-red-400 mr-4">Reject</button>
                                                    </div>
                                                )}
                                                {(app.status === 'accepted' || app.status === 'completed') && (
                                                    <div onClick={(e) => e.stopPropagation()} className="flex items-center space-x-2">
                                                        <input
                                                            className="input-field text-sm"
                                                            placeholder="Diagnosis..."
                                                            value={diagnosis[app.id] || ''}
                                                            onChange={e => setDiagnosis({ ...diagnosis, [app.id]: e.target.value })}
                                                        />
                                                        <button onClick={() => handleDiagnosis(app.id)} className="btn btn-primary text-xs">
                                                            {app.status === 'completed' ? 'Update' : 'Diagnose'}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                        {expandedRow === app.id && (
                                            <tr className="bg-gray-800/50">
                                                <td colSpan="4" className="px-6 py-4">
                                                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                                                        <div>
                                                            <p><span className="font-bold text-gray-400">Appointment Date:</span> {new Date(app.date_time).toLocaleString()}</p>
                                                            <p><span className="font-bold text-gray-400">Doctor Name:</span> {app.doctor_name || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p><span className="font-bold text-gray-400">Diagnosis Description:</span> {app.diagnosis_description || 'None'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                        No appointments found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {
                lastResponse && (
                    <div className="mt-6 p-4 bg-gray-900 text-brand-green rounded font-mono text-sm overflow-auto">
                        <p className="text-gray-500 mb-2">// API Response</p>
                        <pre>{JSON.stringify(lastResponse, null, 2)}</pre>
                    </div>
                )
            }
        </div >
    );
}

export default DoctorDashboard;
