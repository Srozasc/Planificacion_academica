import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, UserPlusIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { PencilIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/solid';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  status: 'Activo' | 'Inactivo';
  lastAccess: string;
  avatar?: string;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      firstName: 'Dr. Juan',
      lastName: 'García',
      email: 'juan.garcia@universidad.edu',
      role: 'Maestro',
      department: 'Ingeniería',
      status: 'Activo',
      lastAccess: '14 jun 2025, 10:30',
      avatar: 'JUG'
    },
    {
      id: '2',
      firstName: 'Prof. María',
      lastName: 'López',
      email: 'maria.lopez@universidad.edu',
      role: 'Editor',
      department: 'Ciencias',
      status: 'Activo',
      lastAccess: '13 jun 2025, 15:45',
      avatar: 'PML'
    },
    {
      id: '3',
      firstName: 'Ana',
      lastName: 'Martínez',
      email: 'ana.martinez@universidad.edu',
      role: 'Visualizador',
      department: 'Administración',
      status: 'Inactivo',
      lastAccess: '10 jun 2025, 09:15',
      avatar: 'AM'
    },
    {
      id: '4',
      firstName: 'Dr. Carlos',
      lastName: 'Rodríguez',
      email: 'carlos.rodriguez@universidad.edu',
      role: 'Editor',
      department: 'Matemáticas',
      status: 'Activo',
      lastAccess: '14 jun 2025, 08:20',
      avatar: 'DCR'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('Todos los roles');
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users);

  // Estadísticas
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.status === 'Activo').length;
  const maestros = users.filter(user => user.role === 'Maestro').length;
  const editores = users.filter(user => user.role === 'Editor').length;

  useEffect(() => {
    let filtered = users;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por rol
    if (roleFilter !== 'Todos los roles') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  const getStatusBadge = (status: string) => {
    return status === 'Activo' 
      ? 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium'
      : 'bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium';
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Maestro':
        return 'bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium';
      case 'Editor':
        return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium';
      case 'Visualizador':
        return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium';
      default:
        return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium';
    }
  };

  const getAvatarColor = (role: string) => {
    switch (role) {
      case 'Maestro':
        return 'bg-purple-500';
      case 'Editor':
        return 'bg-yellow-500';
      case 'Visualizador':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administra los usuarios del sistema de planificación académica</p>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 mr-4">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
                <p className="text-sm text-gray-600">Total Usuarios</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 mr-4">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeUsers}</p>
                <p className="text-sm text-gray-600">Usuarios Activos</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 mr-4">
                <span className="text-2xl">👑</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{maestros}</p>
                <p className="text-sm text-gray-600">Maestros</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 mr-4">
                <span className="text-2xl">✏️</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{editores}</p>
                <p className="text-sm text-gray-600">Editores</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controles de búsqueda y filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Barra de búsqueda */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uc-blue focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtro de roles */}
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uc-blue focus:border-transparent"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option>Todos los roles</option>
                <option>Maestro</option>
                <option>Editor</option>
                <option>Visualizador</option>
              </select>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 text-uc-blue border border-uc-blue rounded-lg hover:bg-blue-50 transition-colors">
                <ArrowDownTrayIcon className="h-4 w-4" />
                Exportar
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-uc-blue border border-uc-blue rounded-lg hover:bg-blue-50 transition-colors">
                <ArrowUpTrayIcon className="h-4 w-4" />
                Importar
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-uc-yellow text-black rounded-lg hover:bg-yellow-500 transition-colors font-medium">
                <UserPlusIcon className="h-4 w-4" />
                Nuevo Usuario
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Acceso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`h-10 w-10 rounded-full ${getAvatarColor(user.role)} flex items-center justify-center text-white font-medium text-sm mr-4`}>
                          {user.avatar}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getRoleBadge(user.role)}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(user.status)}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastAccess}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 p-1">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900 p-1">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900 p-1">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;