import React, { useState, useEffect } from 'react';
import { setupMFA, verifyMFA } from '../api';

function MfaSetup({ user }) {
    const [secret, setSecret] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [token, setToken] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSetup = async () => {
        try {
            const data = await setupMFA();
            setSecret(data.secret);
            setQrCode(data.qrCode);
            setMessage('Scan the QR code with Google Authenticator');
        } catch (err) {
            setError('Failed to generate MFA secret');
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        try {
            const data = await verifyMFA(token, secret, user.username);
            if (data.message === 'MFA Enabled successfully') {
                setMessage('MFA Enabled Successfully!');
                setQrCode('');
                setSecret('');
            } else {
                setError('Invalid Token');
            }
        } catch (err) {
            setError('Verification failed');
        }
    };

    return (
        <div className="max-w-md mx-auto bg-gray-900 p-8 rounded-2xl border border-gray-800">
            <h2 className="text-2xl font-bold mb-6">Multi-Factor Authentication</h2>

            {!qrCode && !message.includes('Enabled') && (
                <button
                    onClick={handleSetup}
                    className="w-full bg-brand-green text-black font-bold py-2 rounded-full hover:bg-brand-green-dark transition"
                >
                    Setup MFA
                </button>
            )}

            {qrCode && (
                <div className="space-y-6 text-center">
                    <p className="text-gray-400">{message}</p>
                    <img src={qrCode} alt="MFA QR Code" className="mx-auto border-4 border-white rounded-lg" />
                    <p className="text-xs text-gray-500 break-all font-mono">Secret: {secret}</p>

                    <form onSubmit={handleVerify} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            maxLength="6"
                            className="w-full bg-black border border-gray-700 rounded-full px-4 py-2 text-center tracking-widest"
                        />
                        <button
                            type="submit"
                            className="w-full bg-brand-green text-black font-bold py-2 rounded-full"
                        >
                            Verify & Enable
                        </button>
                    </form>
                </div>
            )}

            {message && message === 'MFA Enabled Successfully!' && (
                <div className="mt-4 p-4 bg-green-900/30 text-green-400 rounded-lg text-center border border-green-800">
                    {message}
                </div>
            )}

            {error && <div className="mt-4 text-red-400 text-center">{error}</div>}
        </div>
    );
}

export default MfaSetup;
