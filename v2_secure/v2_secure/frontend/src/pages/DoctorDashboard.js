import React, { useState, useEffect } from 'react';
import { getUsers, assignNurse, assignPatient, getDoctorAppointments, acceptAppointment, createDiagnosis } from '../api';

function DoctorDashboard({ user }) {
    const [appointments, setAppointments] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedNurse, setSelectedNurse] = useState('');
    const [selectedPatient, setSelectedPatient] = useState('');
    const [diagnosis, setDiagnosis] = useState({});
    const [lastResponse, setLastResponse] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const apps = await getDoctorAppointments(user.id);
        setAppointments(apps);
        const allUsers = await getUsers();
        setUsers(allUsers);
    };

    const handleAssignNurse = async () => {
        const res = await assignNurse(user.id, selectedNurse);
        setLastResponse(res);
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

    const handleDiagnosis = async (id) => {
        const res = await createDiagnosis(id, user.id, diagnosis[id]);
        setLastResponse(res);
        loadData();
    };

    return (
        <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Doctor Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Assign Nurse</h3>
                    <select className="input-field mb-2" onChange={e => setSelectedNurse(e.target.value)}>
                        <option value="">Select Nurse</option>
                        {users.filter(u => u.role === 'nurse').map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                    </select>
                    <button onClick={handleAssignNurse} className="btn btn-primary w-full">Assign</button>
                </div>
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Assign Patient</h3>
                    <select className="input-field mb-2" onChange={e => setSelectedPatient(e.target.value)}>
                        <option value="">Select Patient</option>
                        {users.filter(u => u.role === 'patient').map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                    </select>
                    <button onClick={handleAssignPatient} className="btn btn-primary w-full">Assign</button>
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
                        <tbody className="bg-white divide-y divide-gray-200">
                            {appointments.map(app => (
                                <tr key={app.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{app.patient_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${app.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{app.reason}</td>
                                    <td className="px-6 py-4 space-y-2">
                                        {app.status === 'pending' && (
                                            <button onClick={() => handleAccept(app.id)} className="text-blue-600 hover:text-blue-900 mr-4">Accept</button>
                                        )}
                                        {app.status === 'accepted' && (
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    className="input-field text-sm"
                                                    placeholder="Diagnosis..."
                                                    onChange={e => setDiagnosis({ ...diagnosis, [app.id]: e.target.value })}
                                                />
                                                <button onClick={() => handleDiagnosis(app.id)} className="btn btn-primary text-xs">Diagnose</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {lastResponse && (
                <div className="mt-6 p-4 bg-gray-900 text-green-400 rounded font-mono text-sm overflow-auto">
                    <p className="text-gray-500 mb-2">// API Response</p>
                    <pre>{JSON.stringify(lastResponse, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}

export default DoctorDashboard;
