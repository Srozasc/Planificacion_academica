import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ExclamationTriangleIcon,
  HomeIcon,
  ArrowLeftIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface ErrorPageProps {
  type?: '404' | '500' | '403' | 'network';
  title?: string;
  message?: string;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
  type = '404',
  title,
  message
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const errorConfig = {
    '404': {
      code: '404',
      title: title || 'Página No Encontrada',
      message: message || 'Lo sentimos, la página que buscas no existe o ha sido movida.',
      icon: <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500" />,
      color: 'yellow'
    },
    '500': {
      code: '500',
      title: title || 'Error del Servidor',
      message: message || 'Ha ocurrido un error interno del servidor. Nuestro equipo técnico ha sido notificado.',
      icon: <ExclamationTriangleIcon className="h-16 w-16 text-red-500" />,
      color: 'red'
    },
    '403': {
      code: '403',
      title: title || 'Acceso Denegado',
      message: message || 'No tienes permisos suficientes para acceder a esta página.',
      icon: <ExclamationTriangleIcon className="h-16 w-16 text-orange-500" />,
      color: 'orange'
    },
    'network': {
      code: 'RED',
      title: title || 'Error de Conexión',
      message: message || 'No se pudo establecer conexión con el servidor. Verifica tu conexión a internet.',
      icon: <ExclamationTriangleIcon className="h-16 w-16 text-blue-500" />,
      color: 'blue'
    }
  };

  const config = errorConfig[type];

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  const reportError = () => {
    // Simular reporte de error
    console.log('Reportando error:', {
      type,
      path: location.pathname,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
    alert('Error reportado. Gracias por tu colaboración.');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Error Icon */}
        <div className="flex justify-center">
          {config.icon}
        </div>

        {/* Error Code */}
        <div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            {config.code}
          </h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {config.title}
          </h2>
          <p className="text-gray-600 mb-8">
            {config.message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGoHome}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <HomeIcon className="h-5 w-5 mr-2" />
              Ir al Inicio
            </button>
            
            <button
              onClick={handleGoBack}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Volver Atrás
            </button>
          </div>

          {/* Additional Actions */}
          <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm">
            {(type === '500' || type === 'network') && (
              <button
                onClick={handleReload}
                className="inline-flex items-center justify-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <ClockIcon className="h-4 w-4 mr-1" />
                Intentar de nuevo
              </button>
            )}
            
            <button
              onClick={reportError}
              className="inline-flex items-center justify-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              Reportar problema
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-sm text-gray-500 space-y-2">
            <p>Si el problema persiste, contacta al soporte técnico:</p>
            <div className="space-y-1">
              <p>📧 soporte@universidad.edu</p>
              <p>📞 +57 (1) 234-5678</p>
              <p>⏰ Lunes a Viernes, 8:00 AM - 6:00 PM</p>
            </div>
          </div>
        </div>

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left text-xs text-gray-600">
            <h3 className="font-semibold mb-2">Información de Debug:</h3>
            <div className="space-y-1">
              <p><strong>Ruta:</strong> {location.pathname}</p>
              <p><strong>Tipo de Error:</strong> {type}</p>
              <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
              <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componentes específicos para diferentes tipos de error
export const NotFoundPage: React.FC = () => (
  <ErrorPage type="404" />
);

export const ServerErrorPage: React.FC = () => (
  <ErrorPage type="500" />
);

export const ForbiddenPage: React.FC = () => (
  <ErrorPage type="403" />
);

export const NetworkErrorPage: React.FC = () => (
  <ErrorPage type="network" />
);

export default ErrorPage;
