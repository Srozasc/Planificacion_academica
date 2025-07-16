import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { User } from '../../services/users.service';
import usersService from '../../services/users.service';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdated: () => void;
}

interface FormData {
  name: string;
  emailInstitucional: string;
  documentoIdentificacion: string;
  telefono: string;
  roleId: number;
  roleExpiresAt?: string;
  previousRoleId?: number;
  isActive: boolean;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    emailInstitucional: '',
    documentoIdentificacion: '',
    telefono: '',
    roleId: 7,
    roleExpiresAt: '',
    previousRoleId: undefined,
    isActive: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Opciones de roles
  const roleOptions = [
    { value: 9, label: 'Maestro' },
    { value: 8, label: 'Editor' },
    { value: 7, label: 'Visualizador' }
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        emailInstitucional: user.emailInstitucional,
        documentoIdentificacion: user.documentoIdentificacion,
        telefono: user.telefono || '',
        roleId: user.roleId,
        roleExpiresAt: user.roleExpiresAt ? user.roleExpiresAt.split('T')[0] : '',
        previousRoleId: user.previousRoleId,
        isActive: user.isActive
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               name === 'roleId' || name === 'previousRoleId' ? parseInt(value) || undefined : value
    }));
    
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

    if (!formData.documentoIdentificacion.trim()) {
      newErrors.documentoIdentificacion = 'El documento de identificación es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) return;

    setIsLoading(true);
    try {
      // Preparar datos para envío, filtrando valores vacíos
      const updateData = {
        ...formData,
        roleExpiresAt: formData.roleExpiresAt || undefined,
        previousRoleId: formData.previousRoleId || undefined
      };
      
      await usersService.updateUser(user.id, updateData);
      onUserUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      setErrors({ general: 'Error al actualizar el usuario. Por favor, intente nuevamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
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
          <label htmlFor="documentoIdentificacion" className="block text-sm font-medium text-gray-700 mb-1">
            Documento de identificación *
          </label>
          <input
            type="text"
            id="documentoIdentificacion"
            name="documentoIdentificacion"
            value={formData.documentoIdentificacion}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.documentoIdentificacion ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Ingrese el documento de identificación"
          />
          {errors.documentoIdentificacion && <p className="mt-1 text-sm text-red-600">{errors.documentoIdentificacion}</p>}
        </div>

        <div>
          <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            type="text"
            id="telefono"
            name="telefono"
            value={formData.telefono}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ingrese el número de teléfono"
          />
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {roleOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={new Date().toISOString().split('T')[0]}
          />
          <p className="mt-1 text-xs text-gray-500">
            Si se especifica, el rol se revertirá automáticamente al rol anterior en esta fecha
          </p>
        </div>

        <div>
          <label htmlFor="previousRoleId" className="block text-sm font-medium text-gray-700 mb-1">
            Rol anterior (para reversión)
          </label>
          <select
            id="previousRoleId"
            name="previousRoleId"
            value={formData.previousRoleId || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar rol anterior</option>
            {roleOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Rol al que se revertirá cuando expire el rol temporal
          </p>
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