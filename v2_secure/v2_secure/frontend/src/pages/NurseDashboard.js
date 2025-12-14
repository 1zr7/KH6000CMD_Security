import React, { useState, useEffect } from 'react';
import { getNurseAppointments, createMedication, deleteMedication } from '../api';

function NurseDashboard({ user }) {
    const [appointments, setAppointments] = useState([]);
    const [medData, setMedData] = useState({});
    const [lastResponse, setLastResponse] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const apps = await getNurseAppointments(user.id);
        setAppointments(apps);
    };

    const handlePrescribe = async (app) => {
        const data = {
            nurseId: user.id,
            patientId: app.patient_id,
            drugName: medData[app.id]?.name,
            dosage: medData[app.id]?.dosage
        };
        const res = await createMedication(app.id, data);
        setLastResponse(res);
        loadData();
    };

    const handleDeleteMedication = async (medId) => {
        const res = await deleteMedication(medId);
        setLastResponse(res);
        loadData();
    };

    const updateMedData = (id, field, value) => {
        setMedData(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    return (
        <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Nurse Dashboard</h2>

            <div className="card">
                <h3 className="text-lg font-semibold mb-4">Assigned Doctor's Appointments</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prescribe Medication</th>
                            </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-gray-700">
                            {appointments.map(app => (
                                <tr key={app.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{app.patient_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{app.doctor_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{app.status}</td>
                                    <td className="px-6 py-4">
                                        {app.medications && app.medications.length > 0 && (
                                            <div className="mb-2 space-y-1">
                                                {app.medications.map((med, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-1 bg-brand-green/10 rounded border border-brand-green/20 text-xs text-brand-green">
                                                        <span>Current: {med.drug_name} ({med.dosage})</span>
                                                        <button
                                                            onClick={() => handleDeleteMedication(med.id)}
                                                            className="ml-2 text-red-500 hover:text-red-400 font-bold"
                                                        >
                                                            x
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex items-center space-x-2">
                                            <input
                                                className="input-field text-sm w-32"
                                                placeholder="Drug Name"
                                                onChange={e => updateMedData(app.id, 'name', e.target.value)}
                                            />
                                            <input
                                                className="input-field text-sm w-24"
                                                placeholder="Dosage"
                                                onChange={e => updateMedData(app.id, 'dosage', e.target.value)}
                                            />
                                            <button onClick={() => handlePrescribe(app)} className="btn btn-primary text-xs">Add</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {lastResponse && (
                <div className="mt-6 p-4 bg-gray-900 text-brand-green rounded font-mono text-sm overflow-auto">
                    <p className="text-gray-500 mb-2">// API Response</p>
                    <pre>{JSON.stringify(lastResponse, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}

export default NurseDashboard;
