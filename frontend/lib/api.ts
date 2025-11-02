import axios from 'axios';

// API base URL - reads from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
// Use sessionStorage so each tab has its own session
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('token'); // Changed from localStorage to sessionStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log network errors for debugging
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('🚨 Network Error - Backend not reachable:', {
        baseURL: api.defaults.baseURL,
        url: error.config?.url,
        message: 'Make sure the backend server is running on port 5000'
      });
    }
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userId');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

