import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api';

function Login({ setUser }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await login(username, password);
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
                setUser(data.user);

                // Redirect based on role
                switch (data.user.role) {
                    case 'admin': navigate('/admin'); break;
                    case 'doctor': navigate('/doctor'); break;
                    case 'nurse': navigate('/nurse'); break;
                    case 'patient': navigate('/patient'); break;
                    default: navigate('/');
                }
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-4xl font-extrabold text-white tracking-tight">
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Or <Link to="/register" className="font-medium text-brand-green hover:text-emerald-400">create a new account</Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <div className="bg-red-900/50 border border-red-800 text-red-200 p-3 rounded text-center text-sm">{error}</div>}

                    <div className="space-y-4">
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
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-brand-green focus:ring-brand-green border-gray-700 rounded bg-gray-900" />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                                Remember me
                            </label>
                        </div>

                        <div className="text-sm">
                            <a href="#" className="font-medium text-brand-green hover:text-emerald-400">
                                Forgot your password?
                            </a>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-full text-black bg-brand-green hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green transition-all transform hover:scale-[1.02]"
                        >
                            Sign In
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;
