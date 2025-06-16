import React, { useState } from 'react';
import { 
  UserIcon, 
  CogIcon, 
  BellIcon,
  ShieldCheckIcon,
  KeyIcon,
  PhotoIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  avatar?: string;
  lastLogin: string;
  accountCreated: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
  systemUpdates: boolean;
}

export const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'user-123',
    name: 'Dr. María García',
    email: 'maria.garcia@universidad.edu',
    role: 'Coordinador Académico',
    department: 'Ingeniería de Sistemas',
    phone: '+57 300 123 4567',
    lastLogin: '2024-01-15T09:30:00Z',
    accountCreated: '2023-02-15T10:00:00Z'
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: false,
    systemUpdates: true
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handleProfileUpdate = () => {
    // Simular actualización de perfil
    console.log('Actualizando perfil:', userProfile);
    setIsEditing(false);
    // Aquí iría la lógica real de actualización
  };

  const handlePasswordChange = () => {
    if (passwords.new !== passwords.confirm) {
      alert('Las contraseñas no coinciden');
      return;
    }
    // Simular cambio de contraseña
    console.log('Cambiando contraseña');
    setPasswords({ current: '', new: '', confirm: '' });
    // Aquí iría la lógica real de cambio de contraseña
  };

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAvatarUpload = () => {
    // Simular subida de avatar
    console.log('Subiendo nueva foto de perfil');
    // Aquí iría la lógica real de subida de imagen
  };

  const tabs = [
    { id: 'profile', name: 'Perfil', icon: UserIcon },
    { id: 'security', name: 'Seguridad', icon: ShieldCheckIcon },
    { id: 'notifications', name: 'Notificaciones', icon: BellIcon },
    { id: 'preferences', name: 'Preferencias', icon: CogIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
          <p className="text-gray-600">Gestiona tu información personal y configuraciones</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                {/* Avatar Section */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      {userProfile.avatar ? (
                        <img 
                          src={userProfile.avatar} 
                          alt="Avatar" 
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-10 w-10 text-gray-400" />
                      )}
                    </div>
                    <button
                      onClick={handleAvatarUpload}
                      className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-full"
                      title="Cambiar foto"
                    >
                      <PhotoIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-gray-900">{userProfile.name}</h3>
                  <p className="text-sm text-gray-600">{userProfile.role}</p>
                </div>

                {/* Navigation */}
                <nav className="space-y-1">
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {tab.name}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Información Personal</h2>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                      >
                        <PencilIcon className="h-4 w-4" />
                        {isEditing ? 'Cancelar' : 'Editar'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={userProfile.name}
                            onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900">{userProfile.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={userProfile.email}
                            onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900">{userProfile.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={userProfile.role}
                            onChange={(e) => setUserProfile(prev => ({ ...prev, role: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900">{userProfile.role}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Departamento</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={userProfile.department}
                            onChange={(e) => setUserProfile(prev => ({ ...prev, department: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900">{userProfile.department}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={userProfile.phone}
                            onChange={(e) => setUserProfile(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900">{userProfile.phone}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Último Acceso</label>
                        <p className="text-gray-900">
                          {new Date(userProfile.lastLogin).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="mt-6 flex gap-3">
                        <button
                          onClick={handleProfileUpdate}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                          Guardar Cambios
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Seguridad</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Cambiar Contraseña</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña Actual</label>
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={passwords.current}
                                onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              >
                                {showPassword ? (
                                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                                ) : (
                                  <EyeIcon className="h-5 w-5 text-gray-400" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nueva Contraseña</label>
                            <input
                              type="password"
                              value={passwords.new}
                              onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nueva Contraseña</label>
                            <input
                              type="password"
                              value={passwords.confirm}
                              onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <button
                            onClick={handlePasswordChange}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                          >
                            <KeyIcon className="h-4 w-4" />
                            Cambiar Contraseña
                          </button>
                        </div>
                      </div>

                      <div className="border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Actividad de la Cuenta</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Cuenta creada:</span>
                              <span className="text-sm text-gray-900">
                                {new Date(userProfile.accountCreated).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Último acceso:</span>
                              <span className="text-sm text-gray-900">
                                {new Date(userProfile.lastLogin).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Estado de la cuenta:</span>
                              <span className="text-sm text-green-600 font-medium">Activa</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Configuración de Notificaciones</h2>
                    
                    <div className="space-y-6">
                      {Object.entries(notifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {key === 'emailNotifications' && 'Notificaciones por Email'}
                              {key === 'pushNotifications' && 'Notificaciones Push'}
                              {key === 'weeklyReports' && 'Reportes Semanales'}
                              {key === 'systemUpdates' && 'Actualizaciones del Sistema'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {key === 'emailNotifications' && 'Recibir notificaciones importantes por email'}
                              {key === 'pushNotifications' && 'Mostrar notificaciones en el navegador'}
                              {key === 'weeklyReports' && 'Recibir resumen semanal de actividades'}
                              {key === 'systemUpdates' && 'Notificar sobre actualizaciones y mantenimiento'}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={() => handleNotificationChange(key as keyof NotificationSettings)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Preferencias del Sistema</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option value="es">Español</option>
                          <option value="en">English</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Zona Horaria</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option value="America/Bogota">Bogotá (GMT-5)</option>
                          <option value="America/New_York">Nueva York (GMT-5)</option>
                          <option value="Europe/Madrid">Madrid (GMT+1)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Formato de Fecha</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                          <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                          <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option value="light">Claro</option>
                          <option value="dark">Oscuro</option>
                          <option value="auto">Automático</option>
                        </select>
                      </div>

                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200">
                        Guardar Preferencias
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
