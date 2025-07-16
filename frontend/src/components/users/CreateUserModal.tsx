import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import usersService, { CreateUserData } from '../../services/users.service';
import { authService, Role } from '../../services/auth.service';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

interface FormData {
  name: string;
  emailInstitucional: string;
  password: string;
  confirmPassword: string;
  roleId: number;
  roleExpiresAt?: string;
  previousRoleId?: number;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    emailInstitucional: '',
    password: '',
    confirmPassword: '',
    roleId: 1, // Visualizador por defecto (nuevo ID)
    roleExpiresAt: '',
    previousRoleId: undefined
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  // Obtener el ID del rol "Editor" dinámicamente
  const getEditorRoleId = (): number => {
    const editorRole = roles.find(role => role.name === 'Editor');
    return editorRole?.id || 2; // Fallback al ID 2 (asumiendo nuevo ID de Editor)
  };

  // Obtener el ID del rol "Visualizador" dinámicamente
  const getVisualizadorRoleId = (): number => {
    const visualizadorRole = roles.find(role => role.name === 'Visualizador');
    return visualizadorRole?.id || 1; // Fallback al ID 1 (nuevo ID de Visualizador)
  };

  // Cargar roles disponibles
  useEffect(() => {
    const loadRoles = async () => {
      try {
        setRolesLoading(true);
        const rolesData = await authService.getRoles();
        setRoles(rolesData);
        
        // Obtener el ID del rol "Visualizador" para inicializar previousRoleId
        const visualizadorRole = rolesData.find(role => role.name === 'Visualizador');
        const visualizadorId = visualizadorRole?.id || 1;
        
        // Si no hay roleId seleccionado y hay roles disponibles, seleccionar el primero
        if (!formData.roleId && rolesData.length > 0) {
          setFormData(prev => ({ 
            ...prev, 
            roleId: rolesData[0].id,
            previousRoleId: visualizadorId
          }));
        } else {
          // Asegurar que previousRoleId esté inicializado
          setFormData(prev => ({ 
            ...prev, 
            previousRoleId: prev.previousRoleId || visualizadorId
          }));
        }
      } catch (error) {
        console.error('Error loading roles:', error);
        setErrors(prev => ({ ...prev, roles: 'Error al cargar los roles' }));
      } finally {
        setRolesLoading(false);
      }
    };

    if (isOpen) {
      loadRoles();
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'roleId') {
      const newRoleId = parseInt(value);
      setFormData(prev => {
        const updatedData = {
          ...prev,
          roleId: newRoleId
        };
        
        // Si el nuevo rol no es Editor, limpiar la fecha de expiración
        if (newRoleId !== getEditorRoleId()) {
          updatedData.roleExpiresAt = '';
        }
        
        return updatedData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
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

    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirme la contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.roleId) {
      newErrors.roleId = 'Seleccione un rol';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const createUserData: CreateUserData = {
        name: formData.name,
        emailInstitucional: formData.emailInstitucional,
        password: formData.password,
        roleId: formData.roleId,
        previousRoleId: formData.previousRoleId,
        ...(formData.roleExpiresAt && formData.roleId === getEditorRoleId() && {
          roleExpiresAt: `${formData.roleExpiresAt}T23:59:59`
        })
      };

      await usersService.createUser(createUserData);
      onUserCreated();
      handleClose();
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Error al crear el usuario. Por favor, intente nuevamente.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      emailInstitucional: '',
      password: '',
      confirmPassword: '',
      roleId: 1,
      roleExpiresAt: '',
      previousRoleId: undefined
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Crear Nuevo Usuario">
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
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ingrese el nombre completo"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
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
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.emailInstitucional ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="usuario@institucion.edu"
          />
          {errors.emailInstitucional && <p className="text-red-500 text-sm mt-1">{errors.emailInstitucional}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Mínimo 6 caracteres"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contraseña *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Repita la contraseña"
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>
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
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.roleId ? 'border-red-500' : 'border-gray-300'
            } ${rolesLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          {errors.roleId && <p className="text-red-500 text-sm mt-1">{errors.roleId}</p>}
        </div>

        {/* Campo de fecha de expiración - solo visible para rol Editor */}
        {formData.roleId === getEditorRoleId() && (
          <div>
            <label htmlFor="roleExpiresAt" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de expiración del rol Editor
            </label>
            <input
              type="date"
              id="roleExpiresAt"
              name="roleExpiresAt"
              value={formData.roleExpiresAt}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.roleExpiresAt ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.roleExpiresAt && <p className="text-red-500 text-sm mt-1">{errors.roleExpiresAt}</p>}
            <p className="text-sm text-gray-600 mt-1">
              Después de esta fecha, el rol cambiará automáticamente a Visualizador
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creando...' : 'Crear Usuario'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateUserModal;