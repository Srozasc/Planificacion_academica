import axios from 'axios';

// API client configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  // Add auth token to requests
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global errors
    return Promise.reject(error);
  }
);

export default apiClient;
