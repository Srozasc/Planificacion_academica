import React, { useState, useEffect } from 'react';
import { User, Edit, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { authService } from '../services/auth.service';

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('perfil');
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { user, isLoading } = useAuthStore();
  const [profileLoading, setProfileLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    nombreCompleto: '',
    email: '',
    cargo: '',
    departamento: '',
    telefono: '',
    ultimoAcceso: ''
  });

  // Cargar perfil actualizado del backend
  const loadUserProfile = async () => {
    try {
      setProfileLoading(true);
      const profile = await authService.getProfile();
      updateProfileData(profile);
    } catch (error) {
      console.error('Error cargando perfil:', error);
      // Si falla, usar los datos del store
      if (user) {
        updateProfileData(user);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  // Función para actualizar los datos del perfil
  const updateProfileData = (userData: any) => {
    const nombreCompleto = userData.name || 
      (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : 
      userData.email.split('@')[0]);
    
    setProfileData({
      nombreCompleto,
      email: userData.email,
      cargo: userData.role || getRoleName(userData.roleId || 0),
      departamento: 'Ingeniería de Sistemas', // Por ahora hardcodeado
      telefono: '+57 300 123 4567', // Por ahora hardcodeado
      ultimoAcceso: new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    });
  };

  // Cargar datos del usuario autenticado
  useEffect(() => {
    if (user && !isLoading) {
      loadUserProfile();
    }
  }, [user, isLoading]);

  // Función para obtener el nombre del rol
  const getRoleName = (roleId: number): string => {
    switch (roleId) {
      case 1:
        return 'Visualizador';
      case 2:
        return 'Editor';
      case 3:
        return 'Maestro';
      default:
        return 'Usuario';
    }
  };

  // Función para obtener las iniciales del usuario
  const getUserInitials = (): string => {
    if (!user) return 'U';
    
    // Si tenemos firstName y lastName
    if (user.firstName && user.lastName) {
      return (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
    }
    
    // Si tenemos name completo
    if (user.name) {
      const nameParts = user.name.split(' ');
      if (nameParts.length >= 2) {
        return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
      }
      return user.name.charAt(0).toUpperCase();
    }
    
    // Fallback al email
    return user.email.charAt(0).toUpperCase();
  };

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);



  const handleProfileSave = async () => {
    try {
      setIsEditing(false);
      // TODO: Implementar endpoint para actualizar perfil de usuario
      // await authService.updateProfile(profileData);
      console.log('Guardando perfil:', profileData);
      
      // Por ahora solo mostramos un mensaje de éxito
      alert('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      alert('Error al actualizar el perfil');
      setIsEditing(true); // Volver al modo edición si hay error
    }
  };

  const handlePasswordChange = async () => {
    // Validaciones
    if (!passwordData.currentPassword) {
      alert('Por favor ingresa tu contraseña actual');
      return;
    }

    if (!passwordData.newPassword) {
      alert('Por favor ingresa una nueva contraseña');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    try {
      setPasswordLoading(true);
      
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      // Limpiar formulario y mostrar éxito
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Contraseña actualizada correctamente');
      
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      
      // Mostrar mensaje de error específico
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error al cambiar la contraseña';
      alert(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };



  // Mostrar loading mientras se cargan los datos
  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-uc-yellow mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Redirigir si no hay usuario autenticado
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No hay usuario autenticado</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-uc-yellow text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <img 
            src="/CAMPUS-VIRTUAL 2.png" 
            alt="DuocUC" 
            className="h-12 w-auto"
          />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
        <p className="text-gray-600">Gestiona tu información personal y configuraciones</p>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Avatar */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
                <div className="w-8 h-8 bg-uc-yellow rounded-full flex items-center justify-center text-white text-sm font-bold absolute ml-16 -mt-8">
                  {getUserInitials()}
                </div>
                <h3 className="font-semibold text-gray-900">{profileData.nombreCompleto}</h3>
                <p className="text-sm text-gray-600">{profileData.cargo}</p>
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('perfil')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === 'perfil'
                      ? 'bg-uc-yellow text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Perfil
                </button>
                <button
                  onClick={() => setActiveTab('seguridad')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === 'seguridad'
                      ? 'bg-uc-yellow text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  Seguridad
                </button>

              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Perfil Tab */}
            {activeTab === 'perfil' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Información Personal</h2>
                    <button
                      onClick={() => isEditing ? handleProfileSave() : setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-uc-yellow text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      {isEditing ? 'Guardar' : 'Editar'}
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre Completo
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.nombreCompleto}
                          onChange={(e) => setProfileData({...profileData, nombreCompleto: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uc-blue focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{profileData.nombreCompleto}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uc-blue focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{profileData.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cargo
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.cargo}
                          onChange={(e) => setProfileData({...profileData, cargo: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uc-blue focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{profileData.cargo}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Departamento
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.departamento}
                          onChange={(e) => setProfileData({...profileData, departamento: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uc-blue focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{profileData.departamento}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={profileData.telefono}
                          onChange={(e) => setProfileData({...profileData, telefono: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uc-blue focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{profileData.telefono}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Último Acceso
                      </label>
                      <p className="text-gray-900">{profileData.ultimoAcceso}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Seguridad Tab */}
            {activeTab === 'seguridad' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Seguridad</h2>
                  <p className="text-gray-600 mt-1">Gestiona tu contraseña y configuraciones de seguridad</p>
                </div>
                <div className="p-6">
                  <div className="max-w-md space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contraseña Actual
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uc-blue focus:border-transparent"
                          placeholder="Ingresa tu contraseña actual"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nueva Contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uc-blue focus:border-transparent"
                          placeholder="Ingresa tu nueva contraseña"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar Nueva Contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uc-blue focus:border-transparent"
                          placeholder="Confirma tu nueva contraseña"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handlePasswordChange}
                      disabled={passwordLoading}
                      className={`w-full px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
                        passwordLoading 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-uc-blue hover:bg-blue-700'
                      }`}
                    >
                      {passwordLoading && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      )}
                      {passwordLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                    </button>
                  </div>
                </div>
              </div>
            )}


          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;