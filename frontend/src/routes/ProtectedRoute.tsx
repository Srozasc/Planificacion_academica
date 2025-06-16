import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requireAny?: boolean; // Si es true, solo necesita uno de los permisos, si es false necesita todos
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requireAny = false,
}) => {
  const { isAuthenticated, hasPermission, hasAnyPermission } = useAuthStore();

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si se requieren permisos específicos
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAny
      ? hasAnyPermission(requiredPermissions)
      : requiredPermissions.every(permission => hasPermission(permission));

    if (!hasRequiredPermissions) {
      return <Navigate to="/error" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
