import React, { useState, useEffect } from 'react';
import { useUsersStore } from '../../store/users.store';
import { usersService } from '../../services/users.service';
import { Input, Select } from '../common/FormControls';
import type { User, CreateUserDto, UpdateUserDto } from '../../types';

interface UserFormProps {
  user?: User | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  email_institucional: string;
  password: string;
  name: string;
  role_id: number | '';
  documento_identificacion: string;
  telefono: string;
  is_active: boolean;
}

interface FormErrors {
  email_institucional?: string;
  password?: string;
  name?: string;
  role_id?: string;
  documento_identificacion?: string;
  telefono?: string;
}

export const UserForm: React.FC<UserFormProps> = ({ user, onSuccess, onCancel }) => {
  const { createUser, updateUser, loading } = useUsersStore();
  const [roles, setRoles] = useState<Array<{ id: number; name: string }>>([]);
  
  const [formData, setFormData] = useState<FormData>({
    email_institucional: '',
    password: '',
    name: '',
    role_id: '',
    documento_identificacion: '',
    telefono: '',
    is_active: true
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos del usuario si está editando
  useEffect(() => {
    if (user) {
      setFormData({
        email_institucional: user.email_institucional,
        password: '', // No cargar la contraseña existente
        name: user.name,
        role_id: user.role_id,
        documento_identificacion: user.documento_identificacion || '',
        telefono: user.telefono || '',
        is_active: user.is_active
      });
    }
  }, [user]);

  // Cargar roles
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const rolesData = await usersService.getRoles();
        setRoles(rolesData);
      } catch (error) {
        console.error('Error loading roles:', error);
      }
    };
    loadRoles();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email_institucional.trim()) {
      newErrors.email_institucional = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_institucional)) {
      newErrors.email_institucional = 'Email inválido';
    }

    if (!user && !formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (!user && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.role_id) {
      newErrors.role_id = 'El rol es requerido';
    }

    if (formData.documento_identificacion && formData.documento_identificacion.length > 20) {
      newErrors.documento_identificacion = 'El documento no puede tener más de 20 caracteres';
    }

    if (formData.telefono && formData.telefono.length > 15) {
      newErrors.telefono = 'El teléfono no puede tener más de 15 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (user) {
        // Actualizar usuario existente
        const updateData: UpdateUserDto = {
          email_institucional: formData.email_institucional,
          name: formData.name,
          role_id: formData.role_id as number,
          is_active: formData.is_active
        };

        if (formData.documento_identificacion) {
          updateData.documento_identificacion = formData.documento_identificacion;
        }

        if (formData.telefono) {
          updateData.telefono = formData.telefono;
        }

        await updateUser(user.id, updateData);
      } else {
        // Crear nuevo usuario
        const createData: CreateUserDto = {
          email_institucional: formData.email_institucional,
          password: formData.password,
          name: formData.name,
          role_id: formData.role_id as number
        };

        if (formData.documento_identificacion) {
          createData.documento_identificacion = formData.documento_identificacion;
        }

        if (formData.telefono) {
          createData.telefono = formData.telefono;
        }

        await createUser(createData);
      }

      onSuccess();
    } catch (error: any) {
      // Los errores ya se manejan en el store
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email */}
        <div className="md:col-span-2">
          <Input
            label="Email Institucional"
            type="email"
            value={formData.email_institucional}
            onChange={(e) => handleInputChange('email_institucional', e.target.value)}
            error={errors.email_institucional}
            required
            placeholder="usuario@planificacion.edu"
          />
        </div>

        {/* Contraseña - solo en creación */}
        {!user && (
          <div className="md:col-span-2">
            <Input
              label="Contraseña"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              error={errors.password}
              required
              placeholder="Mínimo 6 caracteres"
            />
          </div>
        )}

        {/* Nombre */}
        <Input
          label="Nombre Completo"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          error={errors.name}
          required
          placeholder="Nombre completo del usuario"
        />

        {/* Rol */}
        <Select
          label="Rol"
          value={formData.role_id}
          onChange={(e) => handleInputChange('role_id', Number(e.target.value))}
          error={errors.role_id}
          required
          options={[
            { value: '', label: 'Seleccionar rol...' },
            ...roles.map(role => ({ value: role.id, label: role.name }))
          ]}
        />

        {/* Documento */}
        <Input
          label="Documento de Identificación"
          type="text"
          value={formData.documento_identificacion}
          onChange={(e) => handleInputChange('documento_identificacion', e.target.value)}
          error={errors.documento_identificacion}
          placeholder="Cédula, pasaporte, etc."
        />

        {/* Teléfono */}
        <Input
          label="Teléfono"
          type="tel"
          value={formData.telefono}
          onChange={(e) => handleInputChange('telefono', e.target.value)}
          error={errors.telefono}
          placeholder="Número de teléfono"
        />

        {/* Estado - solo en edición */}
        {user && (
          <div className="md:col-span-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Usuario activo</span>
            </label>
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting || loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting || loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {user ? 'Actualizando...' : 'Creando...'}
            </>
          ) : (
            user ? 'Actualizar Usuario' : 'Crear Usuario'
          )}
        </button>
      </div>
    </form>
  );
};
