import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, UserPlusIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import usersService, { User, UsersListResponse } from '../services/users.service';
import EditUserModal from '../components/users/EditUserModal';
import CreateUserModal from '../components/users/CreateUserModal';
import DeleteUserModal from '../components/users/DeleteUserModal';
import UserImportModal from '../features/userManagement/components/UserImportModal';
import { authService, Role } from '../services/auth.service';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('Todos los roles');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const limit = 10;

  // Cargar usuarios desde la API
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit,
        search: searchTerm || undefined,
        roleId: roleFilter !== 'Todos los roles' ? getRoleIdFromName(roleFilter) : undefined,
      };
      
      const response = await usersService.getUsers(params);
      setUsers(response.users);
      setTotalUsers(response.total);
      setTotalPages(Math.ceil(response.total / limit));
    } catch (err) {
      setError('Error al cargar los usuarios');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mapear nombres de roles a IDs usando los roles dinámicos
  const getRoleIdFromName = (roleName: string): number | undefined => {
    const role = roles.find(r => r.name === roleName);
    return role?.id;
  };

  // Obtener nombre del rol desde el usuario (ya viene del backend)
  const getRoleNameFromUser = (user: User): string => {
    return user.roleName || 'Desconocido';
  };

  // Estadísticas calculadas
  const activeUsers = users.filter(user => user.isActive).length;
  const maestroRole = roles.find(r => r.name === 'Maestro');
  const editorRole = roles.find(r => r.name === 'Editor');
  const maestros = maestroRole ? users.filter(user => user.roleId === maestroRole.id).length : 0;
  const editores = editorRole ? users.filter(user => user.roleId === editorRole.id).length : 0;

  // Cargar roles al inicializar
  const loadRoles = async () => {
    try {
      const rolesData = await authService.getRoles();
      setRoles(rolesData);
    } catch (err) {
      console.error('Error loading roles:', err);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    if (roles.length > 0) {
      loadUsers();
    }
  }, [currentPage, searchTerm, roleFilter, roles]);

  // Debounce para la búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        loadUsers();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Generar avatar desde el nombre
  const generateAvatar = (name: string): string => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Formatear fecha
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium'
      : 'bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium';
  };

  const getRoleBadge = (roleId: number) => {
    const role = roles.find(r => r.id === roleId);
    const roleName = role?.name || 'Desconocido';
    
    switch (roleName) {
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

  const getAvatarColor = (roleId: number) => {
    const role = roles.find(r => r.id === roleId);
    const roleName = role?.name || 'Desconocido';
    
    switch (roleName) {
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

  // Funciones para manejar la edición de usuarios
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleUserUpdated = () => {
    loadUsers(); // Recargar la lista de usuarios
  };

  // Funciones para manejar la creación de usuarios
  const handleCreateUser = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleUserCreated = () => {
    loadUsers(); // Recargar la lista de usuarios
  };

  // Funciones para manejar la eliminación de usuarios
  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleUserDeleted = () => {
    loadUsers(); // Recargar la lista de usuarios
  };

  // Funciones para manejar la importación de usuarios
  const handleOpenImportModal = () => {
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
  };

  const handleUsersImported = () => {
    loadUsers(); // Recargar la lista de usuarios
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
                {roles.map(role => (
                  <option key={role.id} value={role.name}>{role.name}</option>
                ))}
              </select>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              {/* <button className="flex items-center gap-2 px-4 py-2 text-uc-blue border border-uc-blue rounded-lg hover:bg-blue-50 transition-colors">
                <ArrowDownTrayIcon className="h-4 w-4" />
                Exportar
              </button> */}
              <button 
                onClick={handleOpenImportModal}
                className="flex items-center gap-2 px-4 py-2 text-uc-blue border border-uc-blue rounded-lg hover:bg-blue-50 transition-colors"
              >
                <ArrowUpTrayIcon className="h-4 w-4" />
                Importar
              </button>
              <button 
                onClick={handleCreateUser}
                className="flex items-center gap-2 px-4 py-2 bg-uc-yellow text-black rounded-lg hover:bg-yellow-500 transition-colors font-medium"
              >
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
                    Rol Temporal
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Actualización
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uc-blue"></div>
                        <span className="ml-2 text-gray-500">Cargando usuarios...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-red-500">
                        <p>{error}</p>
                        <button 
                          onClick={loadUsers}
                          className="mt-2 px-4 py-2 bg-uc-blue text-white rounded-lg hover:bg-blue-600"
                        >
                          Reintentar
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`h-10 w-10 rounded-full ${getAvatarColor(user.roleId)} flex items-center justify-center text-white font-medium text-sm mr-4`}>
                            {generateAvatar(user.name)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">{user.emailInstitucional}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getRoleBadge(user.roleId)}>
                          {getRoleNameFromUser(user)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.roleExpiresAt ? (
                          <div className="text-xs">
                            <div className="text-orange-600 font-medium">
                              Expira: {new Date(user.roleExpiresAt).toLocaleDateString()}
                            </div>
                            {user.previousRoleName && (
                              <div className="text-gray-500">
                                Revertirá a: {user.previousRoleName}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Permanente</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(user.isActive)}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Editar usuario"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600 hover:text-red-900 p-1" 
                            title="Eliminar usuario"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación */}
        {!loading && !error && totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando{' '}
                  <span className="font-medium">{(currentPage - 1) * limit + 1}</span>
                  {' '}a{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * limit, totalUsers)}
                  </span>
                  {' '}de{' '}
                  <span className="font-medium">{totalUsers}</span>
                  {' '}resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Anterior</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Números de página */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber: number = 1;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNumber
                            ? 'z-10 bg-uc-blue border-uc-blue text-white'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Siguiente</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de edición de usuario */}
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        user={selectedUser}
        onUserUpdated={handleUserUpdated}
      />

      {/* Modal de creación de usuario */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onUserCreated={handleUserCreated}
      />

      {/* Modal de eliminación de usuario */}
      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        user={userToDelete}
        onUserDeleted={handleUserDeleted}
      />

      {/* Modal de importación de usuarios */}
      <UserImportModal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        onUsersImported={handleUsersImported}
      />
    </div>
  );
};

export default UsersPage;