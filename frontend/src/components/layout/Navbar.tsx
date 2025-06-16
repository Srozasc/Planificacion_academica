import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error en logout:', error);
      // Aunque haya error, redirigir al login
      navigate('/login');
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/usuarios', label: 'Usuarios', icon: '👥' },
    { path: '/carga-datos', label: 'Carga de Datos', icon: '📁' },
    { path: '/programacion', label: 'Programación', icon: '📅' },
    { path: '/recursos', label: 'Recursos', icon: '🏢' },
    { path: '/reportes', label: 'Reportes', icon: '📊' },
    { path: '/aprobaciones', label: 'Aprobaciones', icon: '✅' },
  ];  return (
    <nav className="bg-blue-800 text-white shadow-lg relative z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo/Brand */}
          <div className="flex items-center min-w-0 flex-1 sm:flex-none py-3">
            <span className="text-sm sm:text-lg lg:text-xl font-bold truncate" style={{ lineHeight: '1.3' }}>
              📚 Sistema de Planificación Académica
            </span>
          </div>

          {/* Desktop Navigation Menu */}
          <div className="hidden md:flex space-x-4 items-center">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  location.pathname === item.path
                    ? 'bg-blue-900 text-white'
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">            <Link
              to="/perfil"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-blue-100 hover:bg-blue-700 hover:text-white transition-colors duration-200"
            >
              <span className="mr-2">👤</span>
              {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Perfil'}
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-md text-sm font-medium text-blue-100 hover:bg-red-600 hover:text-white transition-colors duration-200"
            >
              <span className="mr-2">🚪</span>
              Cerrar Sesión
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-blue-100 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Abrir menú principal</span>
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-blue-900">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    location.pathname === item.path
                      ? 'bg-blue-800 text-white'
                      : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              
              {/* Mobile User Menu */}
              <div className="border-t border-blue-700 pt-4 mt-4">                <Link
                  to="/perfil"
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:bg-blue-700 hover:text-white transition-colors duration-200"
                >
                  <span className="mr-2">👤</span>
                  {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Perfil'}
                </Link>
                <button
                  onClick={() => {
                    closeMobileMenu();
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:bg-red-600 hover:text-white transition-colors duration-200"
                >
                  <span className="mr-2">🚪</span>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
