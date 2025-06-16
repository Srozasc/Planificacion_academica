import React, { useState, useEffect } from 'react';
import { useUsersStore } from '../../store/users.store';
import { usersService } from '../../services/users.service';
import { Table, TableRow, TableCell } from '../common/Table';
import { Input, Select } from '../common/FormControls';
import { Pagination } from '../common/Pagination';
import { Modal, ConfirmModal } from '../common/Modal';
import { UserForm } from './UserForm';
import type { User, QueryUsersDto } from '../../types';

export const UsersList: React.FC = () => {
  const {
    users,
    loading,
    error,
    pagination,
    currentQuery,
    fetchUsers,
    deleteUser,
    setCurrentQuery,
    clearError
  } = useUsersStore();

  const [roles, setRoles] = useState<Array<{ id: number; name: string }>>([]);
  const [filters, setFilters] = useState<QueryUsersDto>({
    search: '',
    role_id: undefined,
    is_active: undefined
  });
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    user: User | null;
  }>({ show: false, user: null });

  // Cargar usuarios y roles al montar el componente
  useEffect(() => {
    fetchUsers();
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const rolesData = await usersService.getRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const handleSearch = () => {
    const query = { ...currentQuery, ...filters, page: 1 };
    setCurrentQuery(query);
    fetchUsers(query);
  };

  const handleResetFilters = () => {
    const resetFilters = { search: '', role_id: undefined, is_active: undefined };
    setFilters(resetFilters);
    const query = { ...currentQuery, ...resetFilters, page: 1 };
    setCurrentQuery(query);
    fetchUsers(query);
  };

  const handlePageChange = (page: number) => {
    const query = { ...currentQuery, page };
    setCurrentQuery(query);
    fetchUsers(query);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setShowUserForm(true);
  };

  const handleDelete = (user: User) => {
    setDeleteConfirm({ show: true, user });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.user) {
      try {
        await deleteUser(deleteConfirm.user.id);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleFormClose = () => {
    setShowUserForm(false);
    setEditingUser(null);
  };

  const handleFormSuccess = () => {
    setShowUserForm(false);
    setEditingUser(null);
    fetchUsers(currentQuery);
  };

  const getRoleName = (roleId: number) => {
    const role = roles.find(r => r.id === roleId);
    return role?.name || 'Sin rol';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <div className="mt-4">
              <button
                onClick={() => {
                  clearError();
                  fetchUsers();
                }}
                className="bg-red-100 px-2 py-1 rounded text-red-800 text-sm hover:bg-red-200"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administra los usuarios del sistema</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Crear Usuario
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Buscar"
            placeholder="Nombre o email..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <Select
            label="Rol"
            value={filters.role_id || ''}
            onChange={(e) => setFilters({ 
              ...filters, 
              role_id: e.target.value ? Number(e.target.value) : undefined 
            })}
            options={[
              { value: '', label: 'Todos los roles' },
              ...roles.map(role => ({ value: role.id, label: role.name }))
            ]}
          />
          <Select
            label="Estado"
            value={filters.is_active !== undefined ? filters.is_active.toString() : ''}
            onChange={(e) => setFilters({ 
              ...filters, 
              is_active: e.target.value ? e.target.value === 'true' : undefined 
            })}
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'true', label: 'Activo' },
              { value: 'false', label: 'Inactivo' }
            ]}
          />
          <div className="flex items-end space-x-2">
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Buscar
            </button>
            <button
              onClick={handleResetFilters}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando usuarios...</span>
          </div>
        ) : (
          <>
            <Table headers={['Usuario', 'Rol', 'Documento', 'Teléfono', 'Estado', 'Creado', 'Acciones']}>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-gray-500">{user.email_institucional}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.role_name || getRoleName(user.role_id)}
                    </span>
                  </TableCell>
                  <TableCell>{user.documento_identificacion || 'N/A'}</TableCell>
                  <TableCell>{user.telefono || 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Table>

            {users.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-2">No se encontraron usuarios</div>
                <p className="text-gray-400">Intenta ajustar los filtros o crear un nuevo usuario</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Modal de formulario */}
      <Modal
        isOpen={showUserForm}
        onClose={handleFormClose}
        title={editingUser ? 'Editar Usuario' : 'Crear Usuario'}
        size="lg"
      >
        <UserForm
          user={editingUser}
          onSuccess={handleFormSuccess}
          onCancel={handleFormClose}
        />
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <ConfirmModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, user: null })}
        onConfirm={confirmDelete}
        title="Eliminar Usuario"
        message={`¿Estás seguro de que deseas eliminar al usuario "${deleteConfirm.user?.name}"? Esta acción no se puede deshacer.`}
        variant="danger"
        confirmText="Eliminar"
      />
    </div>
  );
};
