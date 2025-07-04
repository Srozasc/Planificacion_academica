import React, { useState } from 'react';
import { User, Edit, Lock, Settings, Eye, EyeOff } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('perfil');
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    nombreCompleto: 'Dr. María García',
    email: 'maria.garcia@universidad.edu',
    cargo: 'Coordinador Académico',
    departamento: 'Ingeniería de Sistemas',
    telefono: '+57 300 123 4567',
    ultimoAcceso: '15 de enero de 2024, 06:30'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferences, setPreferences] = useState({
    idioma: 'español',
    tema: 'claro',
    emailNotifications: true,
    pushNotifications: false,
    reportFrequency: 'semanal'
  });

  const handleProfileSave = () => {
    setIsEditing(false);
    // Aquí iría la lógica para guardar los datos del perfil
    console.log('Guardando perfil:', profileData);
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    // Aquí iría la lógica para cambiar la contraseña
    console.log('Cambiando contraseña');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handlePreferencesSave = () => {
    // Aquí iría la lógica para guardar las preferencias
    console.log('Guardando preferencias:', preferences);
  };

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
                  MG
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
                <button
                  onClick={() => setActiveTab('preferencias')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === 'preferencias'
                      ? 'bg-uc-yellow text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Preferencias
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
                      className="w-full px-4 py-2 bg-uc-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Cambiar Contraseña
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Preferencias Tab */}
            {activeTab === 'preferencias' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Preferencias</h2>
                  <p className="text-gray-600 mt-1">Personaliza tu experiencia en el sistema</p>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Idioma
                      </label>
                      <select
                        value={preferences.idioma}
                        onChange={(e) => setPreferences({...preferences, idioma: e.target.value})}
                        className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uc-blue focus:border-transparent"
                      >
                        <option value="español">Español</option>
                        <option value="english">English</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tema
                      </label>
                      <select
                        value={preferences.tema}
                        onChange={(e) => setPreferences({...preferences, tema: e.target.value})}
                        className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uc-blue focus:border-transparent"
                      >
                        <option value="claro">Claro</option>
                        <option value="oscuro">Oscuro</option>
                        <option value="automatico">Automático</option>
                      </select>
                    </div>

                    <button
                      onClick={handlePreferencesSave}
                      className="px-6 py-2 bg-uc-yellow text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      Guardar Preferencias
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