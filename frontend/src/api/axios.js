import axios from 'axios';
import { ENV } from '../config/env';

const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      // Dispatch event or redirect handled in AuthContext or components
      window.dispatchEvent(new Event('auth-error'));
    }
    return Promise.reject(error);
  }
);

export default api;
