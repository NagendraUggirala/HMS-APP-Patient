// API Configuration
export const API_BASE_URL = 'https://hms-backend-t9m3.onrender.com';

// Individual API Paths
export const AUTH_PATIENT_LOGIN = '/api/v1/auth/patient/login';
export const AUTH_PATIENT_REGISTER = '/api/v1/auth/patient/register';
export const AUTH_LOGOUT = '/api/v1/auth/logout';

export const PATIENT_APPOINTMENT_BOOKING_BASE = `${API_BASE_URL}/api/v1/patient-appointment-booking`;
export const PATIENT_DOCUMENT_STORAGE_BASE = `${API_BASE_URL}/api/v1/patient-document-storage`;
export const PATIENT_MEDICAL_HISTORY_BASE = `${API_BASE_URL}/api/v1/patient-medical-history`;
export const PATIENT_PORTAL_DASHBOARD_BASE = `${API_BASE_URL}/api/v1/patient-portal-dashboard`;
export const PATIENT_PRESCRIPTIONS_BASE = `${API_BASE_URL}/api/v1/patient-prescriptions`;
export const PATIENT_BILLING_BASE = `${API_BASE_URL}/api/v1/patient-billing`;
export const PATIENT_PROFILE_BASE = `${API_BASE_URL}/api/v1/patient-profile`;
export const PATIENT_LAB_TESTS_BASE = `${API_BASE_URL}/api/v1/patient-lab-tests`;
export const PATIENT_MESSAGING_BASE = `${API_BASE_URL}/api/v1/patient-messaging`;
export const PATIENT_DISCHARGE_SUMMARY_BASE = `${API_BASE_URL}/api/v1/patient-discharge-summary`;

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
