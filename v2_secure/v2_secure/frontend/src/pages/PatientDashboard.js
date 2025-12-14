import React, { useState, useEffect } from 'react';
import { getPatientAppointments, createAppointment, getUsers } from '../api';

function PatientDashboard({ user }) {
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [newApp, setNewApp] = useState({ doctorId: '', reason: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const apps = await getPatientAppointments(user.id);
        setAppointments(apps);
        const allUsers = await getUsers();
        setDoctors(allUsers.filter(u => u.role === 'doctor'));
    };

    const handleApply = async (e) => {
        e.preventDefault();
        await createAppointment({ patientId: user.id, ...newApp });
        loadData();
    };

    return (
        <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">My Health</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <div className="card">
                        <h3 className="text-lg font-semibold mb-4">Book Appointment</h3>
                        <form onSubmit={handleApply} className="space-y-4">
                            <select className="input-field" onChange={e => setNewApp({ ...newApp, doctorId: e.target.value })}>
                                <option value="">Select Doctor</option>
                                {doctors.map(d => <option key={d.id} value={d.id}>{d.username}</option>)}
                            </select>
                            <textarea
                                className="input-field"
                                placeholder="Reason for visit..."
                                rows="3"
                                onChange={e => setNewApp({ ...newApp, reason: e.target.value })}
                            />
                            <button type="submit" className="btn btn-primary w-full">Apply</button>
                        </form>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <div className="card">
                        <h3 className="text-lg font-semibold mb-4">History</h3>
                        <div className="space-y-4">
                            {appointments.map(app => (
                                <div key={app.id} className="border rounded p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="font-semibold text-blue-600">{app.doctor_name || 'Unassigned'}</span>
                                            <span className="text-gray-500 text-sm ml-2">{new Date(app.date_time).toLocaleDateString()}</span>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${app.status === 'completed' ? 'bg-brand-green/20 text-brand-green' : 'bg-gray-700 text-gray-300'}`}>{app.status}</span>
                                    </div>
                                    <p className="text-gray-700 mb-2">Reason: {app.reason}</p>

                                    {app.diagnosis && (
                                        <div className="bg-red-900/20 p-3 rounded mt-2">
                                            <p className="font-semibold text-red-400 text-sm">Diagnosis:</p>
                                            <p className="text-red-300">{app.diagnosis}</p>
                                        </div>
                                    )}

                                    {app.drug_name && (
                                        <div className="bg-brand-green/20 p-3 rounded mt-2">
                                            <p className="font-semibold text-brand-green text-sm">Medication:</p>
                                            <p className="text-brand-green">{app.drug_name} - {app.dosage}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
}

export default PatientDashboard;
