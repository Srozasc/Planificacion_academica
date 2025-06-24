import React, { useState, useEffect } from 'react';
import { useBimestreStore } from '../../store/bimestre.store';
import { CreateBimestreDto } from '../../services/bimestre.service';
import { 
  PlusIcon, 
  XMarkIcon, 
  CalendarIcon
} from '@heroicons/react/24/outline';

interface BimestreConfiguradorProps {
  isOpen: boolean;
  onClose: () => void;
}

const BimestreConfigurador: React.FC<BimestreConfiguradorProps> = ({ isOpen, onClose }) => {
  const {
    bimestres,
    isLoading,
    error,
    fetchBimestres,
    crearBimestre,
    clearError
  } = useBimestreStore();

  const [formData, setFormData] = useState<CreateBimestreDto>({
    nombre: '',
    fechaInicio: '',
    fechaFin: '',
    anoAcademico: new Date().getFullYear(),
    numeroBimestre: 1,
    descripcion: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchBimestres();
      clearError();
    }
  }, [isOpen, fetchBimestres, clearError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'anoAcademico' || name === 'numeroBimestre' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      clearError(); // Limpiar errores previos
      await crearBimestre(formData);
      setFormData({
        nombre: '',
        fechaInicio: '',
        fechaFin: '',
        anoAcademico: new Date().getFullYear(),
        numeroBimestre: 1,
        descripcion: ''
      });
    } catch (error) {
      console.error('Error al crear bimestre:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Configuración de Bimestres
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>          )}

          {/* Creación manual */}
          <div className="border rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <PlusIcon className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Crear Bimestre Manual
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Bimestre
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej: Primer Bimestre 2025"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Bimestre
                  </label>
                  <input
                    type="number"
                    name="numeroBimestre"
                    value={formData.numeroBimestre}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Año Académico
                  </label>
                  <input
                    type="number"
                    name="anoAcademico"
                    value={formData.anoAcademico}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="2020"
                    max="2030"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    name="fechaInicio"
                    value={formData.fechaInicio}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Fin
                  </label>
                  <input
                    type="date"
                    name="fechaFin"
                    value={formData.fechaFin}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Descripción del bimestre..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Crear Bimestre</span>
                </button>
              </div>
            </form>
          </div>

          {/* Lista de bimestres existentes */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Bimestres Configurados
            </h3>
            {bimestres.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No hay bimestres configurados aún.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {bimestres.map((bimestre) => (
                  <div
                    key={bimestre.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {bimestre.nombre}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(bimestre.fechaInicio).toLocaleDateString('es-ES')} - {' '}
                        {new Date(bimestre.fechaFin).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          bimestre.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {bimestre.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BimestreConfigurador;
