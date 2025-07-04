import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { resourceService, Resource, ResourceStats, ResourceFilters } from './services/resource.service';

const ResourceManagementPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [stats, setStats] = useState<ResourceStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<ResourceFilters>({});
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('view');

  // Cargar recursos y estadísticas
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resourcesData, statsData] = await Promise.all([
        resourceService.getResources(filters),
        resourceService.getResourceStats()
      ]);
      setResources(resourcesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  // Manejar filtros
  const handleFilterChange = (key: keyof ResourceFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  // Abrir modal
  const openModal = (mode: 'view' | 'create' | 'edit', resource?: Resource) => {
    setModalMode(mode);
    setSelectedResource(resource || null);
    setIsModalOpen(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedResource(null);
  };

  // Obtener color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponible': return 'bg-green-100 text-green-800';
      case 'ocupado': return 'bg-orange-100 text-orange-800';
      case 'mantenimiento': return 'bg-red-100 text-red-800';
      case 'reservado': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener icono del tipo
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'aula': return '🏛️';
      case 'laboratorio': return '🔬';
      case 'equipo': return '📱';
      case 'software': return '💻';
      default: return '📦';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          Gestión de Recursos
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Administra aulas, laboratorios, equipos y software
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Recursos</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalResources}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white text-lg sm:text-xl flex-shrink-0 ml-3">
                📦
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Disponibles</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.availableResources}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center text-white text-lg sm:text-xl flex-shrink-0 ml-3">
                ✅
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">En Uso</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.inUseResources}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-lg flex items-center justify-center text-white text-lg sm:text-xl flex-shrink-0 ml-3">
                👁️
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Mantenimiento</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.maintenanceResources}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 rounded-lg flex items-center justify-center text-white text-lg sm:text-xl flex-shrink-0 ml-3">
                🔧
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar recursos, docentes, aulas..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.searchTerm || ''}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                />
              </div>

              {/* Type Filter */}
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="">Todos los Tipos</option>
                <option value="aula">Aulas</option>
                <option value="laboratorio">Laboratorios</option>
                <option value="equipo">Equipos</option>
                <option value="software">Software</option>
              </select>

              {/* Status Filter */}
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">Todos los Estados</option>
                <option value="disponible">Disponible</option>
                <option value="ocupado">Ocupado</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="reservado">Reservado</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => openModal('create')}
                className="bg-uc-yellow hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Nuevo Recurso
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resources Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recurso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Cargando recursos...
                  </td>
                </tr>
              ) : resources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No se encontraron recursos
                  </td>
                </tr>
              ) : (
                resources.map((resource) => (
                  <tr key={resource.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getTypeIcon(resource.type)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{resource.name}</div>
                          {resource.description && (
                            <div className="text-sm text-gray-500">{resource.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="capitalize text-sm text-gray-900">{resource.type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {resource.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {resource.capacity ? `${resource.capacity} personas` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(resource.status)}`}>
                        {resource.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal('view', resource)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openModal('edit', resource)}
                          className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Reservar"
                        >
                          <CalendarIcon className="h-4 w-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Eliminar"
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

      {/* Modal Placeholder */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {modalMode === 'create' && 'Crear Nuevo Recurso'}
                  {modalMode === 'edit' && 'Editar Recurso'}
                  {modalMode === 'view' && 'Detalles del Recurso'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {selectedResource && modalMode === 'view' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <p className="text-sm text-gray-900">{selectedResource.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <p className="text-sm text-gray-900 capitalize">{selectedResource.type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                    <p className="text-sm text-gray-900">{selectedResource.location}</p>
                  </div>
                  {selectedResource.capacity && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
                      <p className="text-sm text-gray-900">{selectedResource.capacity} personas</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedResource.status)}`}>
                      {selectedResource.status}
                    </span>
                  </div>
                  {selectedResource.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                      <p className="text-sm text-gray-900">{selectedResource.description}</p>
                    </div>
                  )}
                  {selectedResource.equipment && selectedResource.equipment.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Equipamiento</label>
                      <ul className="text-sm text-gray-900 list-disc list-inside">
                        {selectedResource.equipment.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {(modalMode === 'create' || modalMode === 'edit') && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Formulario de {modalMode === 'create' ? 'creación' : 'edición'} en desarrollo</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceManagementPage;