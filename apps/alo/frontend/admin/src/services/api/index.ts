import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_PUBLIC_API_BASE_URL || 'http://localhost:80';

// Helper function to create API instance with specific prefix
export const createApiClient = (prefix: string) => {
  const api = axios.create({
    baseURL: `${API_BASE_URL}${prefix}`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add auth token to requests
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return api;
};
