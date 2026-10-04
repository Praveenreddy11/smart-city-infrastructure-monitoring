import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Request Interceptor: Attach JWT Token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use((response) => response, (error) => {
  if (error.response && error.response.status === 401) {
    // If token expired or invalid, clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  return Promise.reject(error);
});

export default api;
