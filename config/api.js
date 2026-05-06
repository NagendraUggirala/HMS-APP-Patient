// API Configuration
export const API_BASE_URL = 'https://hms-backend-t9m3.onrender.com';

// Individual API Paths
export const AUTH_PATIENT_LOGIN = '/api/v1/auth/patient/login';
export const AUTH_PATIENT_REGISTER = '/api/v1/auth/patient/register';
export const AUTH_LOGOUT = '/api/v1/auth/logout';

export const PATIENT_APPOINTMENT_BOOKING_BASE = `${API_BASE_URL}/api/v1/patient-appointment-booking`;

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}${AUTH_PATIENT_LOGIN}`,
  REGISTER: `${API_BASE_URL}${AUTH_PATIENT_REGISTER}`,
  LOGOUT: `${API_BASE_URL}${AUTH_LOGOUT}`,
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  AUTH_PATIENT_LOGIN,
};
