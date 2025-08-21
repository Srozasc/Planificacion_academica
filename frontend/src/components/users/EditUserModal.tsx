import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { User } from '../../services/users.service';
import usersService, { AdminChangePasswordData, UserPermissions, UpdateUserPermissionsData } from '../../services/users.service';
import { authService, Role } from '../../services/auth.service';
import { carrerasService, Carrera } from '../../services/carreras.service';
import { asignaturasService } from '../../services/asignaturas.service';
import { useBimestreStore } from '../../store/bimestre.store';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdated: () => void;
}

interface FormData {
  name: string;
  emailInstitucional: string;
  roleId: number;
  roleExpiresAt?: string;
  previousRoleId?: number;
  isActive: boolean;
  tipoPermiso?: 'categoria' | 'carrera';
  categorias?: string[];
  carreras?: number[];
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated
}) => {
  const { bimestreSeleccionado } = useBimestreStore();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    emailInstitucional: '',
    roleId: 1, // Nuevo ID de Visualizador
    roleExpiresAt: '',
    previousRoleId: 1, // Por defecto será Visualizador (nuevo ID)
    isActive: true,
    tipoPermiso: undefined,
    categorias: [],
    carreras: []
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
    adminPassword: '',
    changePassword: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [carrerasLoading, setCarrerasLoading] = useState(true);
  const [categoriasLoading, setCategoriasLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Obtener el ID del rol "Visualizador" dinámicamente
  const getVisualizadorRoleId = (): number => {
    const visualizadorRole = roles.find(role => role.name === 'Visualizador');
    return visualizadorRole?.id || 1; // Fallback al ID 1 (nuevo ID de Visualizador)
  };

  // Obtener el ID del rol "Editor" dinámicamente
  const getEditorRoleId = (): number => {
    const editorRole = roles.find(role => role.name === 'Editor');
    return editorRole?.id || 2; // Fallback al ID 2 (asumiendo nuevo ID de Editor)
  };

  // Cargar roles al montar el componente
  useEffect(() => {
    const loadRoles = async () => {
      try {
        setRolesLoading(true);
        const rolesData = await authService.getRoles();
        setRoles(rolesData);
      } catch (error) {
        console.error('Error cargando roles:', error);
        // En caso de error, usar roles por defecto con nuevos IDs
        setRoles([
          { id: 3, name: 'Maestro', description: 'Rol de maestro' },
          { id: 2, name: 'Editor', description: 'Rol de editor' },
          { id: 1, name: 'Visualizador', description: 'Rol de visualizador' }
        ]);
      } finally {
        setRolesLoading(false);
      }
    };
    loadRoles();
  }, []);

  // Cargar carreras y categorías
  useEffect(() => {
    const loadCarrerasYCategorias = async () => {
      try {
        setCarrerasLoading(true);
        setCategoriasLoading(true);
        
        const [carrerasData, categoriasData] = await Promise.all([
          carrerasService.getCarreras(bimestreSeleccionado?.id),
          asignaturasService.getCategorias(bimestreSeleccionado?.id)
        ]);
        
        setCarreras(carrerasData);
        setCategorias(categoriasData);
      } catch (error) {
        console.error('Error loading carreras y categorias:', error);
        setErrors(prev => ({ ...prev, carreras: 'Error al cargar carreras y categorías' }));
      } finally {
        setCarrerasLoading(false);
        setCategoriasLoading(false);
      }
    };

    if (isOpen) {
      loadCarrerasYCategorias();
    }
  }, [isOpen, bimestreSeleccionado?.id]);

  // Cargar permisos del usuario
  useEffect(() => {
    const loadUserPermissions = async () => {
      if (!user || !bimestreSeleccionado) return;
      
      try {
        setPermissionsLoading(true);
        const permissions = await usersService.getUserPermissions(user.id, bimestreSeleccionado.id);
        setUserPermissions(permissions);
        
        // Actualizar formData con los permisos existentes
         if (permissions) {
           setFormData(prev => ({
             ...prev,
             tipoPermiso: permissions.tipoPermiso,
             categorias: permissions.categorias || [],
             carreras: permissions.carreras || []
           }));
         }
      } catch (error) {
        console.error('Error loading user permissions:', error);
        setUserPermissions(null);
      } finally {
        setPermissionsLoading(false);
      }
    };

    if (isOpen && user && bimestreSeleccionado) {
      loadUserPermissions();
    }
  }, [isOpen, user, bimestreSeleccionado]);

  // Resetear el estado de contraseña cada vez que se abre el modal
  useEffect(() => {
    if (isOpen) {
      setPasswordData({
        newPassword: '',
        confirmPassword: '',
        adminPassword: '',
        changePassword: false,
      });
      setPasswordError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (user && roles.length > 0) {
      const visualizadorId = getVisualizadorRoleId();
      setFormData({
        name: user.name,
        emailInstitucional: user.emailInstitucional,
        roleId: user.roleId,
        roleExpiresAt: user.roleExpiresAt ? new Date(user.roleExpiresAt).toISOString().slice(0, 10) : '',
        previousRoleId: user.previousRoleId || visualizadorId,
        isActive: user.isActive
      });
    }
  }, [user, roles]);

  // Actualizar formData cuando se cargan los roles por primera vez
  useEffect(() => {
    if (roles.length > 0 && !user) {
      const visualizadorId = getVisualizadorRoleId();
      setFormData(prev => ({
        ...prev,
        roleId: visualizadorId,
        previousRoleId: visualizadorId
      }));
    }
  }, [roles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                     name === 'roleId' || name === 'previousRoleId' ? parseInt(value) || undefined : value;
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: newValue
      };
      
      // Si se cambia el rol y no es Editor, limpiar la fecha de expiración
      const editorId = getEditorRoleId();
      if (name === 'roleId' && newValue !== editorId) {
        updated.roleExpiresAt = '';
      }
      
      // Si se cambia el tipo de permiso, limpiar los valores relacionados
      if (name === 'tipoPermiso') {
        updated.categorias = [];
        updated.carreras = [];
      }
      
      return updated;
    });
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCarreraToggle = (carreraId: number) => {
    setFormData(prev => {
      const currentCarreras = prev.carreras || [];
      const isSelected = currentCarreras.includes(carreraId);
      
      return {
        ...prev,
        carreras: isSelected 
          ? currentCarreras.filter(id => id !== carreraId)
          : [...currentCarreras, carreraId]
      };
    });
  };

  const handleCategoriaToggle = (categoria: string) => {
    setFormData(prev => {
      const currentCategorias = prev.categorias || [];
      const isSelected = currentCategorias.includes(categoria);
      
      return {
        ...prev,
        categorias: isSelected 
          ? currentCategorias.filter(cat => cat !== categoria)
          : [...currentCategorias, categoria]
      };
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setPasswordData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpiar errores de contraseña cuando el usuario empiece a escribir
    if (passwordError) {
      setPasswordError(null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.emailInstitucional.trim()) {
      newErrors.emailInstitucional = 'El email institucional es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailInstitucional)) {
      newErrors.emailInstitucional = 'El email debe tener un formato válido';
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que haya un bimestre seleccionado
    if (!bimestreSeleccionado) {
      setErrors({ general: 'Debe seleccionar un bimestre en el navbar antes de editar un usuario. Si no aparece ningún bimestre, contacte al administrador.' });
      return;
    }

    // Validar que el bimestre tenga un ID válido
    if (!bimestreSeleccionado.id || bimestreSeleccionado.id <= 0) {
      setErrors({ general: `Error: El bimestre seleccionado no tiene un ID válido (ID: ${bimestreSeleccionado.id}). Por favor, seleccione otro bimestre.` });
      return;
    }
    
    if (!validateForm() || !user) return;

    setIsLoading(true);
    setPasswordError(null);
    
    try {
      // Preparar datos para envío, incluyendo sincronización completa de permisos
      const { tipoPermiso, categorias, carreras, ...userUpdateData } = formData;
      const updateData: any = {
        ...userUpdateData,
        previousRoleId: formData.previousRoleId || undefined
      };
      
      // Solo agregar roleExpiresAt si tiene un valor válido
      if (formData.roleExpiresAt && formData.roleExpiresAt.trim() !== '') {
        updateData.roleExpiresAt = `${formData.roleExpiresAt}T23:59:59`;
      }
      
      // Agregar sincronización completa de permisos
      if (formData.tipoPermiso === 'carrera') {
        // Enviar lista completa de IDs de carreras seleccionadas
        updateData.careerPermissionIds = formData.carreras || [];
        updateData.categoryPermissionIds = []; // Limpiar permisos de categoría
      } else if (formData.tipoPermiso === 'categoria' && formData.categorias && formData.categorias.length > 0) {
         // Enviar array de categorías
         updateData.categoryPermissionIds = formData.categorias;
         updateData.careerPermissionIds = []; // Limpiar permisos de carrera
      } else {
        // Si no hay tipo de permiso seleccionado, limpiar todos los permisos
        updateData.careerPermissionIds = [];
        updateData.categoryPermissionIds = [];
      }
      
      // Filtrar campos undefined para no enviarlos al backend
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === '') {
          delete updateData[key];
        }
      });
      
      // Actualizar datos del usuario con sincronización completa de permisos
      await usersService.updateUser(user.id, updateData, bimestreSeleccionado?.id);
      
      // Si se solicita cambio de contraseña, procesarlo
      if (passwordData.changePassword) {
        // Validaciones de contraseña
        if (!passwordData.newPassword) {
          setPasswordError('La nueva contraseña es requerida');
          setIsLoading(false);
          return;
        }
        
        if (passwordData.newPassword.length < 6) {
          setPasswordError('La nueva contraseña debe tener al menos 6 caracteres');
          setIsLoading(false);
          return;
        }
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          setPasswordError('Las contraseñas no coinciden');
          setIsLoading(false);
          return;
        }
        
        if (!passwordData.adminPassword) {
          setPasswordError('Debe ingresar su contraseña para validar el cambio');
          setIsLoading(false);
          return;
        }

        const changePasswordData: AdminChangePasswordData = {
          userId: user.id,
          newPassword: passwordData.newPassword,
          adminPassword: passwordData.adminPassword,
        };

        await usersService.adminChangePassword(changePasswordData);
      }
      
      onUserUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating user:', error);
      if (error.response?.data?.message) {
        if (error.response.data.message.includes('contraseña')) {
          setPasswordError(error.response.data.message);
        } else {
          setErrors({ general: error.response.data.message });
        }
      } else {
        setErrors({ general: 'Error al actualizar el usuario. Por favor, intente nuevamente.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPasswordData({
      newPassword: '',
      confirmPassword: '',
      adminPassword: '',
      changePassword: false,
    });
    setErrors({});
    setPasswordError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Usuario"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errors.general}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre completo *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Ingrese el nombre completo"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="emailInstitucional" className="block text-sm font-medium text-gray-700 mb-1">
            Email institucional *
          </label>
          <input
            type="email"
            id="emailInstitucional"
            name="emailInstitucional"
            value={formData.emailInstitucional}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.emailInstitucional ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="usuario@institucion.edu"
          />
          {errors.emailInstitucional && <p className="mt-1 text-sm text-red-600">{errors.emailInstitucional}</p>}
        </div>





        <div>
          <label htmlFor="roleId" className="block text-sm font-medium text-gray-700 mb-1">
            Rol *
          </label>
          <select
            id="roleId"
            name="roleId"
            value={formData.roleId}
            onChange={handleInputChange}
            disabled={rolesLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {rolesLoading ? (
              <option value="">Cargando roles...</option>
            ) : (
              roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label htmlFor="roleExpiresAt" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de expiración del rol
          </label>
          <input
            type="date"
            id="roleExpiresAt"
            name="roleExpiresAt"
            value={formData.roleExpiresAt || ''}
            onChange={handleInputChange}
            disabled={formData.roleId !== getEditorRoleId()}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formData.roleId !== getEditorRoleId() ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            min={new Date().toISOString().split('T')[0]}
          />
          <p className="mt-1 text-xs text-gray-500">
            Si se especifica, el rol se revertirá automáticamente a Visualizador en esta fecha
          </p>
        </div>

        {/* Campo oculto para rol anterior - siempre será Visualizador por defecto */}
        <div style={{ display: 'none' }}>
          <label htmlFor="previousRoleId" className="block text-sm font-medium text-gray-700 mb-1">
            Rol anterior (para reversión)
          </label>
          <select
            id="previousRoleId"
            name="previousRoleId"
            value={formData.previousRoleId || 1}
            onChange={handleInputChange}
            disabled={rolesLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar rol anterior</option>
            {rolesLoading ? (
              <option value="">Cargando roles...</option>
            ) : (
              roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))
            )}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Rol al que se revertirá cuando expire el rol temporal
          </p>
        </div>

        {/* Sección de cambio de contraseña */}
        <div className="border-t pt-4">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="changePassword"
              name="changePassword"
              checked={passwordData.changePassword}
              onChange={handlePasswordChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="changePassword" className="ml-2 block text-sm font-medium text-gray-700">
              Cambiar contraseña del usuario
            </label>
          </div>

          {passwordData.changePassword && (
            <div className="space-y-4 ml-6">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva contraseña *
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar nueva contraseña *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Repita la nueva contraseña"
                />
              </div>

              <div>
                <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Su contraseña (para validar) *
                </label>
                <input
                  type="password"
                  id="adminPassword"
                  name="adminPassword"
                  value={passwordData.adminPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ingrese su contraseña actual"
                />
              </div>

              {passwordError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {passwordError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sección de Permisos de Acceso */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Permisos de Acceso</h3>
          
          {permissionsLoading ? (
            <div className="text-sm text-gray-500">Cargando permisos...</div>
          ) : (
            <>
              {/* Tipo de Permiso */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Permiso
                </label>
                <select
                  name="tipoPermiso"
                  value={formData.tipoPermiso || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin permisos específicos</option>
                  <option value="categoria">Por Categoría</option>
                  <option value="carrera">Por Carrera</option>
                </select>
              </div>

              {/* Permisos por Categoría */}
              {formData.tipoPermiso === 'categoria' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categorías * (seleccione una o más)
                  </label>
                  {categoriasLoading ? (
                    <div className="text-sm text-gray-500">Cargando categorías...</div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                      {categorias.map((categoria) => (
                        <label key={categoria} className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            checked={formData.categorias?.includes(categoria) || false}
                            onChange={() => handleCategoriaToggle(categoria)}
                            className="mr-2"
                          />
                          <span className="text-sm">
                            {categoria}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                  {formData.categorias && formData.categorias.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      {formData.categorias.length} categoría(s) seleccionada(s)
                    </p>
                  )}
                </div>
              )}

              {/* Permisos por Carrera */}
              {formData.tipoPermiso === 'carrera' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Carreras *
                  </label>
                  {carrerasLoading ? (
                    <div className="text-sm text-gray-500">Cargando carreras...</div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                      {carreras.map((carrera) => (
                        <label key={carrera.id} className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            checked={formData.carreras?.includes(carrera.id) || false}
                            onChange={() => handleCarreraToggle(carrera.id)}
                            className="mr-2"
                          />
                          <span className="text-sm">
                            {carrera.codigo_plan} - {carrera.nombre_carrera}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
            Usuario activo
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditUserModal;