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
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      
      // Limpiar el store de autenticación
      // Importamos dinámicamente para evitar dependencias circulares
      import('../store/auth.store').then(({ useAuthStore }) => {
        useAuthStore.getState().clearAuth();
      });
      
      // Solo redirigir si no estamos ya en la página de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
