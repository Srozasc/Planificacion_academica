import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth.store';

interface AppWrapperProps {
  children: React.ReactNode;
}

const AppWrapper: React.FC<AppWrapperProps> = ({ children }) => {
  const { loadSession, isLoading } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await loadSession();
      } catch (error) {
        console.error('Error inicializando la aplicación:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, [loadSession]);

  // Mostrar loading mientras se carga la sesión
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AppWrapper;
