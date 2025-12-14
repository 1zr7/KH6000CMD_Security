import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api';

function Register() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'patient', // Hardcoded to patient
        name: '',
        dob: '',
        address: '',
        specialty: ''
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await register(formData);
            if (data.id) {
                navigate('/login');
            } else {
                setError(data.error || 'Registration failed');
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
                        Create Account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Or <Link to="/login" className="font-medium text-brand-green hover:text-brand-green-dark">sign in to your existing account</Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <div className="bg-red-900/50 border border-red-800 text-red-200 p-3 rounded text-center text-sm">{error}</div>}

                    <div className="rounded-md shadow-sm -space-y-px">
                        {/* Role selection removed - Defaults to Patient */}

                        <div className="space-y-4">
                            <input
                                name="username"
                                type="text"
                                required
                                className="appearance-none rounded-full relative block w-full px-5 py-3 border border-gray-700 placeholder-gray-500 text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent sm:text-sm transition-all"
                                placeholder="Username"
                                value={formData.username}
                                onChange={handleChange}
                            />
                            <input
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-full relative block w-full px-5 py-3 border border-gray-700 placeholder-gray-500 text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent sm:text-sm transition-all"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                            />

                            {/* Patient Fields (Always shown now) */}
                            <input name="name" type="text" className="appearance-none rounded-full relative block w-full px-5 py-3 border border-gray-700 placeholder-gray-500 text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent sm:text-sm transition-all" placeholder="Full Name" value={formData.name} onChange={handleChange} />
                            <input name="dob" type="date" className="appearance-none rounded-full relative block w-full px-5 py-3 border border-gray-700 placeholder-gray-500 text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent sm:text-sm transition-all" placeholder="Date of Birth" value={formData.dob} onChange={handleChange} />
                            <input name="address" type="text" className="appearance-none rounded-full relative block w-full px-5 py-3 border border-gray-700 placeholder-gray-500 text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent sm:text-sm transition-all" placeholder="Address" value={formData.address} onChange={handleChange} />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-full text-black bg-brand-green hover:bg-brand-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green transition-all transform hover:scale-[1.02]"
                        >
                            Sign Up
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Register;
