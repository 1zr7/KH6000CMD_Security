import React, { useState, useEffect } from 'react';
import { getUsers, createUser, deleteUser } from '../api';

function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'doctor', name: '', specialty: '', email: '' });
    const [lastResponse, setLastResponse] = useState(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        const data = await getUsers();
        setUsers(data);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        const res = await createUser(newUser);
        setLastResponse(res);
        loadUsers();
    };

    const handleDelete = async (id) => {
        const res = await deleteUser(id);
        setLastResponse(res);
        loadUsers();
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Create User</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <input className="input-field" placeholder="Username" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} />
                        <input className="input-field" placeholder="Email" type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                        <input className="input-field" type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                        <select className="input-field" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                            <option value="doctor">Doctor</option>
                            <option value="nurse">Nurse</option>
                        </select>
                        <input className="input-field" placeholder="Full Name" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                        {newUser.role === 'doctor' && (
                            <input className="input-field" placeholder="Specialty" value={newUser.specialty} onChange={e => setNewUser({ ...newUser, specialty: e.target.value })} />
                        )}
                        <button type="submit" className="btn btn-primary w-full">Create User</button>
                    </form>
                </div>

                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Existing Users</h3>
                    <ul className="space-y-2">
                        {users.map(u => (
                            <li key={u.id} className="flex justify-between items-center p-2 border-b">
                                <span>{u.username} ({u.role})</span>
                                <button onClick={() => handleDelete(u.id)} className="text-red-600 text-sm hover:underline">Delete</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <AuditLogs />

            {lastResponse && (
                <div className="mt-6 p-4 bg-gray-900 text-brand-green rounded font-mono text-sm overflow-auto">
                    <p className="text-gray-500 mb-2">// API Response</p>
                    <pre>{JSON.stringify(lastResponse, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}

function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [page, setPage] = useState(1);
    // eslint-disable-next-line
    const [pagination, setPagination] = useState({});

    useEffect(() => {
        loadLogs();
        // eslint-disable-next-line
    }, [page]);

    const loadLogs = async () => {
        const { getAuditLogs } = require('../api');
        const data = await getAuditLogs(page);
        setLogs(data.logs || []);
        setPagination(data.pagination || {});
    };

    return (
        <div className="card mt-6">
            <h3 className="text-lg font-semibold mb-4">Security Audit Logs</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="text-left p-2">Timestamp</th>
                            <th className="text-left p-2">Action</th>
                            <th className="text-left p-2">User</th>
                            <th className="text-left p-2">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id} className="border-b border-gray-800">
                                <td className="p-2 text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="p-2 font-mono text-brand-green">{log.action}</td>
                                <td className="p-2">{log.actor_name || 'System'} (ID: {log.actor_id})</td>
                                <td className="p-2 text-gray-500 truncate max-w-xs" title={log.details}>{log.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn btn-secondary text-sm">Prev</button>
                <button onClick={() => setPage(page + 1)} className="btn btn-secondary text-sm">Next</button>
            </div>
        </div>
    );
}

export default AdminUsers;
