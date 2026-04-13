import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A standard fetch wrapper that adds Authorization headers and handles JSON.
 * @param {string} url 
 * @param {object} options 
 */
export async function apiFetch(url, options = {}) {
  try {
    const storedUser = await AsyncStorage.getItem('currentUser');
    const user = storedUser ? JSON.parse(storedUser) : null;
    
    // Robust token extraction: check common keys and handle nested objects
    let token = user?.token || user?.accessToken || user?.access_token || user?.access || user?.jwt;
    
    // If token is an object, try to find a string inside it (common for JWT pairs)
    if (token && typeof token === 'object') {
      token = token.access || token.accessToken || token.token || token.jwt || null;
    }
    
    if (!token) {
      console.warn(`[apiFetch] No token found for request to ${url}. This will likely cause a 401.`);
    }

    const headers = {
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn(`[apiFetch] AUTH MISSING for ${url}`);
    }

    // Add hospital-id if present in the session (common for multi-tenant systems)
    const hospitalId = user?.hospital_id || user?.hospitalId;
    if (hospitalId) {
      headers['Hospital-Id'] = hospitalId;
      headers['x-hospital-id'] = hospitalId;
    }

    // Only add JSON content-type if there's a body or it's a mutating request
    if (['POST', 'PUT', 'PATCH'].includes(options.method?.toUpperCase()) || options.body) {
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    }

    const config = {
      ...options,
      headers,
      credentials: 'include', // Important for CORS and potential session cookies
    };

    // Add X-Requested-With to identify as AJAX request (can bypass some WAFs)
    headers['X-Requested-With'] = 'XMLHttpRequest';

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);

    // Note: We return the raw response object because the caller 
    // (patientApi.js) expects to call .json() and check .ok themselves.
    return response;
  } catch (error) {
    console.error('apiFetch error:', error);
    throw error;
  }
}
