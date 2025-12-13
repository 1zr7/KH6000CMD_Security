import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Header({ user, onLogout }) {
    const location = useLocation();
    const isHome = location.pathname === '/';

    return (
        <header className={`w-full z-50 transition-all duration-300 ${isHome ? 'absolute top-0 bg-transparent' : 'bg-black shadow-sm border-b border-gray-800'}`}>
            <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
                <div className="flex items-center">
                    <Link to="/" className={`text-2xl font-bold tracking-tighter text-green-500`}>
                        HealthCareAlpha
                    </Link>
                </div>
                <nav className="flex items-center space-x-8">
                    <Link to="/" className={`font-medium hover:text-brand-green transition-colors text-gray-300`}>Home</Link>
                    {user ? (
                        <>
                            {user.role === 'admin' && <Link to="/admin" className={`font-medium hover:text-brand-green transition-colors text-gray-300`}>Admin</Link>}
                            {user.role === 'doctor' && <Link to="/doctor" className={`font-medium hover:text-brand-green transition-colors text-gray-300`}>Dashboard</Link>}
                            {user.role === 'nurse' && <Link to="/nurse" className={`font-medium hover:text-brand-green transition-colors text-gray-300`}>Dashboard</Link>}
                            {user.role === 'patient' && <Link to="/patient" className={`font-medium hover:text-brand-green transition-colors text-gray-300`}>My Health</Link>}
                            <Link to="/patients" className={`font-medium hover:text-brand-green transition-colors text-gray-300`}>Patients</Link>

                            <div className={`flex items-center ml-4 pl-4 border-l border-gray-700`}>
                                <span className={`text-sm mr-3 text-gray-400`}>
                                    {user.username} <span className="px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green text-xs uppercase border border-brand-green/20">{user.role}</span>
                                </span>
                                <Link to="/profile" className={`text-sm hover:text-brand-green mr-3 text-gray-300`}>Profile</Link>
                                <button onClick={onLogout} className="text-sm text-red-500 hover:text-red-400">Logout</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className={`font-medium hover:text-brand-green transition-colors text-gray-300`}>Login</Link>
                            <Link to="/register" className="px-5 py-2 bg-brand-green text-brand-dark font-bold rounded-full hover:bg-emerald-400 transition-all shadow-lg shadow-brand-green/20">Register</Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}

export default Header;
