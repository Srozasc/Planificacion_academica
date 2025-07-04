import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { LoginRequest } from '../../services/auth.service';

const LoginPageFixed: React.FC = () => {
  const { isAuthenticated } = useAuthStore();  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Obtener la función para actualizar el store
  const updateAuthState = (authData: any) => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: authData.user,
      permissions: authData.permissions,
      token: authData.access_token,
      isLoading: false,
    });
  };

  // Redirigir si ya está autenticado
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error cuando el usuario empiece a escribir
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Por favor ingrese email y contraseña');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Usar fetch directamente en lugar del store para evitar problemas con Axios/Zustand
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_institucional: formData.email,
          password: formData.password,
        }),
      });      if (response.ok) {
        const data = await response.json();
          // Guardar el token manualmente
        localStorage.setItem('token', data.access_token);
        
        // Actualizar el store de Zustand directamente
        updateAuthState(data);
        
        console.log('Login exitoso, estado actualizado');
      } else {
        const errorData = await response.json();
        
        if (response.status === 401) {
          setError('Usuario o contraseña incorrectos');
        } else if (response.status === 403) {
          setError('Usuario inactivo o sin permisos');
        } else {
          setError(`Error del servidor: ${errorData.message || 'Intente nuevamente'}`);
        }
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setError('Error de conexión. Verifique su conexión a internet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          {/* Logo DuocUC */}
          <div className="mx-auto mb-6">
            <img 
              src="/CAMPUS-VIRTUAL 2.png" 
              alt="DuocUC Campus Virtual" 
              className="mx-auto h-16 w-auto"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Planificación Académica
          </h2>
          <p className="text-sm text-gray-600">
            Inicie sesión en su cuenta
          </p>
        </div>

        <form className="mt-8 space-y-4 bg-white p-8 rounded-lg shadow-md" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="Contraseña"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error de autenticación
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              🔒 {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Sistema de Planificación Académica v1.0
            </p>
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-600">
                <strong>Email de prueba:</strong> admin@planificacion.edu<br />
                <strong>Contraseña:</strong> admin123
              </p>
            </div>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Sistema de Planificación Académica v1.0
          </p>
        </div>

        <div className="mt-4 text-center">
          <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
            <p className="text-sm text-blue-600 mb-1">
              <strong>Email de prueba:</strong> admin@planificacion.edu
            </p>
            <p className="text-sm text-blue-600">
              <strong>Contraseña:</strong> admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPageFixed;
