import React, { useEffect, useState } from 'react';
import { getPatients, searchPatients } from '../api';

function PatientsList() {
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
        setSearchMsg(`Results for: ${query}`);
        const data = await searchPatients(query);
        setPatients(data);
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
                        <span>{searchMsg}</span>
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
                                <tr key={p.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{p.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">{p.dob}</td>
                                    <td className="px-6 py-4 text-gray-400">{p.address}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default PatientsList;
