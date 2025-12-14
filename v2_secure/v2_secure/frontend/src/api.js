const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const request = async (endpoint, options = {}) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        credentials: 'include', // Include cookies
        ...options,
    });
    const data = await res.json();
    console.log(`[API] ${endpoint}`, data); // WARNING: Insecure logging
    return data;
};

export const login = (username, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
});

export const verifyOTP = (username, otp) => request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ username, otp }),
});

export const logout = () => request('/auth/logout', { method: 'POST' });

// Old MFA implementation removed/replaced
// export const setupMFA = ...

export const register = (data) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
});

export const changePassword = (username, newPassword) => request('/auth/password', {
    method: 'PUT',
    body: JSON.stringify({ username, newPassword }),
});

export const getPatients = () => request('/patients');
export const searchPatients = (q) => request(`/patients/search?q=${q}`);
export const getPatientAppointments = (id) => request(`/patients/${id}/appointments`);
export const createAppointment = (data) => request('/patients/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
});

export const getUsers = () => request('/admin/users');
export const createUser = (data) => request('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
});
export const deleteUser = (id) => request(`/admin/users/${id}`, { method: 'DELETE' });

export const getDoctorDetails = (doctorId) => request(`/doctor/${doctorId}/details`);
export const assignNurse = (doctorId, nurseId) => request(`/doctor/${doctorId}/assign-nurse`, {
    method: 'POST',
    body: JSON.stringify({ nurseId }),
});
export const assignPatient = (doctorId, patientId) => request(`/doctor/${doctorId}/assign-patient`, {
    method: 'POST',
    body: JSON.stringify({ patientId }),
});
export const getDoctorAppointments = (doctorId) => request(`/doctor/${doctorId}/appointments`);
export const acceptAppointment = (id) => request(`/doctor/appointments/${id}/accept`, { method: 'PUT' });
export const rejectAppointment = (id) => request(`/doctor/appointments/${id}/reject`, { method: 'PUT' });
export const createDiagnosis = (id, doctorId, description) => request(`/doctor/appointments/${id}/diagnosis`, {
    method: 'POST',
    body: JSON.stringify({ doctorId, description }),
});

export const getNurseAppointments = (nurseId) => request(`/nurse/${nurseId}/appointments`);
export const createMedication = (id, data) => request(`/nurse/appointments/${id}/medication`, {
    method: 'POST',
    body: JSON.stringify(data),
});
export const deleteMedication = (id) => request(`/nurse/medications/${id}`, { method: 'DELETE' });
