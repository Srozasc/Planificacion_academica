import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { Bars3Icon, XMarkIcon, UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

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
  };  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/usuarios', label: 'Usuarios', icon: '👥' },
    { path: '/carga-datos', label: 'Carga de Datos', icon: '📁' },
    { path: '/programacion', label: 'Programación', icon: '📅' },
    { path: '/recursos', label: 'Recursos', icon: '📚' },
    { path: '/reportes', label: 'Reportes', icon: '📊' },
    { path: '/aprobaciones', label: 'Aprobaciones', icon: '✅' },
  ];return (
    <>
      {/* Header superior amarillo */}
      <div className="bg-uc-yellow text-black py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img src="/CAMPUS-VIRTUAL_blanco.png" alt="UC Campus Virtual" className="h-8" />
            <span className="font-bold text-lg">Sistema de Planificación Académica</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link 
              to="/perfil"
              className="flex items-center space-x-2 text-sm hover:underline transition-colors duration-200"
            >
              <UserIcon className="h-5 w-5" />
              <span>{user?.firstName ? `${user.firstName} ${user.lastName}` : 'Perfil'}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm hover:underline flex items-center space-x-1"
            >
              <span>Cerrar Sesión</span>
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Navbar principal */}
      <nav className="bg-uc-blue text-white shadow-lg relative z-50 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            {/* Logo UC */}
            <div className="flex items-center">
            </div>

            {/* Desktop Navigation Menu */}
            <div className="hidden md:flex space-x-1 items-center flex-1 justify-center">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    location.pathname === item.path
                      ? 'bg-white text-uc-blue rounded-md'
                      : 'text-white hover:bg-blue-700 hover:text-white rounded-md'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
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
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-blue-800 border-t border-blue-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    location.pathname === item.path
                      ? 'bg-white text-uc-blue'
                      : 'text-white hover:bg-blue-700 hover:text-white'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
