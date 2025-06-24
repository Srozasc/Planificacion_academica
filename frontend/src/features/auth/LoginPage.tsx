import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { LoginRequest } from '../../services/auth.service';

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuthStore();  const [formData, setFormData] = useState<LoginRequest>({
    email_institucional: '',
    password: '',
  });const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Listener para errores no capturados que pueden causar recargas de página
    const handleUnhandledError = (event: ErrorEvent) => {
      console.log('LoginPage: Error no capturado detectado:', event.error);
      if (event.error?.name === 'AxiosError') {
        console.log('LoginPage: AxiosError no capturado, previniendo comportamiento por defecto');
        event.preventDefault();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.log('LoginPage: Promise rejection no capturada:', event.reason);
      if (event.reason?.name === 'AxiosError') {
        console.log('LoginPage: AxiosError rejection no capturada, previniendo comportamiento por defecto');
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

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
  };  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('LoginPage: Formulario enviado');
    
    if (!formData.email_institucional || !formData.password) {
      setError('Por favor ingrese email y contraseña');
      return;
    }

    try {
      console.log('LoginPage: Iniciando proceso de login');
      setIsSubmitting(true);
      setError('');
      await login(formData);
      console.log('LoginPage: Login completado exitosamente');    } catch (error: any) {
      console.log('LoginPage: Error capturado en catch block:', error);
      console.log('LoginPage: Error response status:', error.response?.status);
      console.log('LoginPage: Error response data:', error.response?.data);
      console.log('LoginPage: Error name:', error.name);
      console.log('LoginPage: Error message:', error.message);
      
      // Prevenir cualquier comportamiento de redirección
      if (error.response) {
        // Error de respuesta HTTP
        if (error.response.status === 401) {
          console.log('LoginPage: Estableciendo mensaje de error 401');
          setError('Usuario o contraseña incorrectos');
        } else if (error.response.status === 403) {
          console.log('LoginPage: Estableciendo mensaje de error 403');
          setError('Usuario inactivo o sin permisos');
        } else {
          console.log('LoginPage: Estableciendo mensaje de error HTTP genérico');
          setError(`Error del servidor: ${error.response.status}`);
        }
      } else if (error.request) {
        // Error de red
        console.log('LoginPage: Error de red');
        setError('Error de conexión. Verifique su conexión a internet.');
      } else {
        // Otro tipo de error
        console.log('LoginPage: Error desconocido');
        setError('Error inesperado. Intente nuevamente.');
      }
      
      console.log('LoginPage: Mensaje de error establecido');    } finally {
      console.log('LoginPage: Finalizando proceso de login, isSubmitting = false');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Planificación Académica
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Inicie sesión en su cuenta
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email_institucional"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={formData.email_institucional}
                onChange={handleInputChange}
                disabled={isSubmitting || isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isSubmitting || isLoading}
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
              disabled={isSubmitting || isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {isSubmitting || isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-indigo-300"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 text-indigo-300 group-hover:text-indigo-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
              {isSubmitting || isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>          <div className="text-center">
            <p className="text-xs text-gray-500">
              Sistema de Planificación Académica v1.0
            </p>            <div className="mt-4 p-3 bg-blue-50 rounded-md">              <p className="text-xs text-blue-600">
                <strong>Email de prueba:</strong> admin@planificacion.edu<br />
                <strong>Contraseña:</strong> admin123
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
