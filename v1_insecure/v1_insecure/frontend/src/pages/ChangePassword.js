import React, { useState } from 'react';
import { changePassword } from '../api';

function ChangePassword({ user }) {
    const [newPassword, setNewPassword] = useState('');
    const [msg, setMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        await changePassword(user.username, newPassword);
        setMsg('Password updated successfully');
    };

    return (
        <div className="max-w-md mx-auto mt-10">
            <div className="card">
                <h2 className="text-2xl font-bold mb-6">Change Password</h2>
                {msg && <div className="bg-brand-green/20 text-brand-green-dark p-3 rounded mb-4">{msg}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">New Password</label>
                        <input type="password" className="input-field" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-primary w-full">Update</button>
                </form>
            </div>
        </div>
    );
}

export default ChangePassword;
