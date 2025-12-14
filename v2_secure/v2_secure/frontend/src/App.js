import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminUsers from './pages/AdminUsers';
import DoctorDashboard from './pages/DoctorDashboard';
import NurseDashboard from './pages/NurseDashboard';
import PatientDashboard from './pages/PatientDashboard';
import PatientsList from './pages/PatientsList';
import ChangePassword from './pages/ChangePassword';
import MfaSetup from './pages/MfaSetup';
import { logout } from './api';

function App() {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

    const handleLogout = async () => {
        try {
            await logout();
        } catch (e) {
            console.error('Logout failed', e);
        }
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <Router>
            <div className="min-h-screen bg-black text-gray-200">
                <Header user={user} onLogout={handleLogout} />
                <Routes>
                    {/* Home Route - Full Width for Hero */}
                    <Route path="/" element={
                        <div className="w-full">
                            <Hero />
                        </div>
                    } />

                    {/* Other Routes - Wrapped in Container */}
                    <Route path="/*" element={
                        <div className="container mx-auto px-4 pb-12 pt-20">
                            <Routes>
                                <Route path="/login" element={<Login setUser={setUser} />} />
                                <Route path="/register" element={<Register />} />

                                <Route path="/admin" element={user && user.role === 'admin' ? <AdminUsers /> : <Navigate to="/login" />} />
                                <Route path="/doctor" element={user && user.role === 'doctor' ? <DoctorDashboard user={user} /> : <Navigate to="/login" />} />
                                <Route path="/nurse" element={user && user.role === 'nurse' ? <NurseDashboard user={user} /> : <Navigate to="/login" />} />
                                <Route path="/patient" element={user && user.role === 'patient' ? <PatientDashboard user={user} /> : <Navigate to="/login" />} />

                                <Route path="/patients" element={user ? <PatientsList /> : <Navigate to="/login" />} />
                                <Route path="/profile" element={user ? <ChangePassword user={user} /> : <Navigate to="/login" />} />
                                <Route path="/mfa" element={user ? <MfaSetup user={user} /> : <Navigate to="/login" />} />
                            </Routes>
                        </div>
                    } />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
