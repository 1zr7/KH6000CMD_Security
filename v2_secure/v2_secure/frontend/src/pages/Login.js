import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, verifyOTP } from '../api';

function Login({ setUser }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState(''); // MFA Token
    const [showMfa, setShowMfa] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (showMfa) {
                // Step 2: Verify OTP
                const data = await verifyOTP(username, token);
                if (data.user) {
                    handleLoginSuccess(data.user);
                } else {
                    setError(data.error || 'Verification failed');
                }
            } else {
                // Step 1: Login
                const data = await login(username, password);
                if (data.mfaRequired) {
                    setShowMfa(true);
                    setError('Code sent to your email'); // Info message
                } else if (data.user) {
                    // If 2FA disabled (future proof), just login
                    handleLoginSuccess(data.user);
                } else {
                    setError(data.error || 'Login failed');
                }
            }
        } catch (err) {
            setError(err.message || 'Network error');
        }
    };

    const handleLoginSuccess = (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        switch (user.role) {
            case 'admin': navigate('/admin'); break;
            case 'doctor': navigate('/doctor'); break;
            case 'nurse': navigate('/nurse'); break;
            case 'patient': navigate('/patient'); break;
            default: navigate('/');
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-4xl font-extrabold text-white tracking-tight">
                        {showMfa ? 'Security Verification' : 'Welcome Back'}
                    </h2>
                    {!showMfa && (
                        <p className="mt-2 text-center text-sm text-gray-400">
                            Or <Link to="/register" className="font-medium text-brand-green hover:text-brand-green-dark">create a new account</Link>
                        </p>
                    )}
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <div className="bg-red-900/50 border border-red-800 text-red-200 p-3 rounded text-center text-sm">{error}</div>}

                    <div className="space-y-4">
                        {!showMfa ? (
                            <>
                                <input
                                    name="username"
                                    type="text"
                                    required
                                    className="appearance-none rounded-full relative block w-full px-5 py-3 border border-gray-700 placeholder-gray-500 text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent sm:text-sm transition-all"
                                    placeholder="Username"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                />
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="appearance-none rounded-full relative block w-full px-5 py-3 border border-gray-700 placeholder-gray-500 text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent sm:text-sm transition-all"
                                    placeholder="Password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </>
                        ) : (
                            <input
                                name="token"
                                type="text"
                                required
                                className="appearance-none rounded-full relative block w-full px-5 py-3 border border-gray-700 placeholder-gray-500 text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent sm:text-sm transition-all text-center tracking-[0.5em] font-mono text-xl"
                                placeholder="000000"
                                maxLength="6"
                                value={token}
                                onChange={e => setToken(e.target.value)}
                            />
                        )}
                    </div>

                    {!showMfa && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-brand-green focus:ring-brand-green border-gray-700 rounded bg-gray-900" />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-medium text-brand-green hover:text-brand-green-dark">
                                    Forgot your password?
                                </a>
                            </div>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-full text-black bg-brand-green hover:bg-brand-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green transition-all transform hover:scale-[1.02]"
                        >
                            {showMfa ? 'Verify Token' : 'Sign In'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;
