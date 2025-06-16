import React, { useState } from 'react';
import { 
  BuildingOfficeIcon, 
  ComputerDesktopIcon, 
  AcademicCapIcon,
  WrenchScrewdriverIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface Resource {
  id: string;
  name: string;
  type: 'aula' | 'laboratorio' | 'equipo' | 'software';
  capacity?: number;
  location: string;
  status: 'disponible' | 'ocupado' | 'mantenimiento' | 'reservado';
  description: string;
  specifications?: Record<string, any>;
  availability: {
    [key: string]: boolean; // días de la semana
  };
}

export const ResourceManagementPage: React.FC = () => {  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const mockResources: Resource[] = [
    {
      id: '1',
      name: 'Aula 101',
      type: 'aula',
      capacity: 40,
      location: 'Edificio A - Piso 1',
      status: 'disponible',
      description: 'Aula estándar con proyector y audio',
      specifications: {
        proyector: 'Sí',
        audio: 'Sí',
        pizarra: 'Pizarra digital',
        aire_acondicionado: 'Sí'
      },
      availability: {
        lunes: true,
        martes: true,
        miercoles: false,
        jueves: true,
        viernes: true,
        sabado: false,
        domingo: false
      }
    },
    {
      id: '2',
      name: 'Lab. Sistemas 1',
      type: 'laboratorio',
      capacity: 25,
      location: 'Edificio B - Piso 2',
      status: 'ocupado',
      description: 'Laboratorio de sistemas con 25 computadores',
      specifications: {
        computadores: 25,
        software: ['Visual Studio', 'Eclipse', 'MySQL'],
        red: 'Gigabit Ethernet',
        servidor: 'Servidor local'
      },
      availability: {
        lunes: true,
        martes: false,
        miercoles: true,
        jueves: false,
        viernes: true,
        sabado: false,
        domingo: false
      }
    },
    {
      id: '3',
      name: 'Proyector Portátil 001',
      type: 'equipo',
      location: 'Almacén - Audiovisuales',
      status: 'disponible',
      description: 'Proyector portátil para uso en diferentes aulas',
      specifications: {
        marca: 'Epson',
        modelo: 'PowerLite X39',
        resolucion: '1024x768',
        lumenes: 3500,
        conexiones: ['HDMI', 'VGA', 'USB']
      },
      availability: {
        lunes: true,
        martes: true,
        miercoles: true,
        jueves: true,
        viernes: true,
        sabado: true,
        domingo: false
      }
    },
    {
      id: '4',
      name: 'Lab. Física 1',
      type: 'laboratorio',
      capacity: 20,
      location: 'Edificio C - Piso 1',
      status: 'mantenimiento',
      description: 'Laboratorio de física con equipos especializados',
      specifications: {
        equipos: ['Osciloscopio', 'Multímetros', 'Fuentes de poder'],
        bancas: 10,
        campana_extraccion: 'Sí',
        agua: 'Sí'
      },
      availability: {
        lunes: false,
        martes: false,
        miercoles: false,
        jueves: false,
        viernes: false,
        sabado: false,
        domingo: false
      }
    },
    {
      id: '5',
      name: 'MATLAB Campus License',
      type: 'software',
      location: 'Licencia de campus',
      status: 'disponible',
      description: 'Licencia de campus para MATLAB y toolboxes',
      specifications: {
        usuarios_concurrentes: 50,
        toolboxes: ['Signal Processing', 'Image Processing', 'Statistics'],
        vigencia: '2024-12-31',
        soporte: 'Incluido'
      },
      availability: {
        lunes: true,
        martes: true,
        miercoles: true,
        jueves: true,
        viernes: true,
        sabado: true,
        domingo: true
      }
    }
  ];

  const resourceTypes = [
    { id: 'all', name: 'Todos los Recursos', icon: BuildingOfficeIcon },
    { id: 'aula', name: 'Aulas', icon: BuildingOfficeIcon },
    { id: 'laboratorio', name: 'Laboratorios', icon: ComputerDesktopIcon },
    { id: 'equipo', name: 'Equipos', icon: WrenchScrewdriverIcon },
    { id: 'software', name: 'Software', icon: AcademicCapIcon }
  ];

  const statusOptions = [
    { id: 'all', name: 'Todos los Estados' },
    { id: 'disponible', name: 'Disponible' },
    { id: 'ocupado', name: 'Ocupado' },
    { id: 'mantenimiento', name: 'Mantenimiento' },
    { id: 'reservado', name: 'Reservado' }
  ];

  const filteredResources = mockResources.filter(resource => {
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || resource.status === selectedStatus;
    const matchesSearch = 
      resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponible': return 'bg-green-100 text-green-800';
      case 'ocupado': return 'bg-red-100 text-red-800';
      case 'mantenimiento': return 'bg-yellow-100 text-yellow-800';
      case 'reservado': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'aula': return <BuildingOfficeIcon className="h-5 w-5" />;
      case 'laboratorio': return <ComputerDesktopIcon className="h-5 w-5" />;
      case 'equipo': return <WrenchScrewdriverIcon className="h-5 w-5" />;
      case 'software': return <AcademicCapIcon className="h-5 w-5" />;
      default: return <BuildingOfficeIcon className="h-5 w-5" />;
    }
  };
  const handleNewResource = () => {
    console.log('Crear nuevo recurso');
    // Aquí iría la lógica para abrir el modal de creación
  };

  const handleEditResource = (resource: Resource) => {
    console.log('Editar recurso:', resource);
    // Aquí iría la lógica para abrir el modal de edición
  };

  const handleDeleteResource = (resourceId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este recurso?')) {
      console.log('Eliminando recurso:', resourceId);
      // Aquí iría la lógica real de eliminación
    }
  };

  const handleReserveResource = (resourceId: string) => {
    console.log('Reservando recurso:', resourceId);
    // Aquí iría la lógica real de reserva
  };

  const getResourceStats = () => {
    const total = mockResources.length;
    const disponible = mockResources.filter(r => r.status === 'disponible').length;
    const ocupado = mockResources.filter(r => r.status === 'ocupado').length;
    const mantenimiento = mockResources.filter(r => r.status === 'mantenimiento').length;
    
    return { total, disponible, ocupado, mantenimiento };
  };

  const stats = getResourceStats();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Recursos</h1>
          <p className="text-gray-600">Administra aulas, laboratorios, equipos y software</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Recursos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Disponibles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.disponible}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <EyeIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En Uso</p>
                <p className="text-2xl font-bold text-gray-900">{stats.ocupado}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <WrenchScrewdriverIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mantenimiento</p>
                <p className="text-2xl font-bold text-gray-900">{stats.mantenimiento}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {resourceTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map(status => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>

              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar recursos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                />
              </div>
            </div>

            <button
              onClick={handleNewResource}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Nuevo Recurso
            </button>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map(resource => (
            <div key={resource.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getTypeIcon(resource.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{resource.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{resource.type}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(resource.status)}`}>
                    {resource.status.charAt(0).toUpperCase() + resource.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4" />
                    {resource.location}
                  </div>
                  {resource.capacity && (
                    <div className="text-sm text-gray-600">
                      Capacidad: {resource.capacity} personas
                    </div>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4">{resource.description}</p>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedResource(resource)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-1"
                  >
                    <EyeIcon className="h-4 w-4" />
                    Ver Detalles
                  </button>
                  
                  {resource.status === 'disponible' && (
                    <button
                      onClick={() => handleReserveResource(resource.id)}
                      className="px-3 py-2 border border-green-500 text-green-600 hover:bg-green-50 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      Reservar
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleEditResource(resource)}
                    className="px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors duration-200"
                    title="Editar"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteResource(resource.id)}
                    className="px-3 py-2 border border-red-300 hover:bg-red-50 text-red-600 rounded-lg text-sm font-medium transition-colors duration-200"
                    title="Eliminar"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron recursos</h3>
            <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}

        {/* Resource Details Modal */}
        {selectedResource && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Detalles del Recurso
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nombre:</label>
                    <p className="text-gray-900">{selectedResource.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tipo:</label>
                    <p className="text-gray-900 capitalize">{selectedResource.type}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Ubicación:</label>
                    <p className="text-gray-900">{selectedResource.location}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Estado:</label>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedResource.status)}`}>
                      {selectedResource.status.charAt(0).toUpperCase() + selectedResource.status.slice(1)}
                    </span>
                  </div>
                  
                  {selectedResource.capacity && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Capacidad:</label>
                      <p className="text-gray-900">{selectedResource.capacity} personas</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Descripción:</label>
                    <p className="text-gray-900">{selectedResource.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedResource.specifications && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Especificaciones:</label>
                      <div className="mt-2 space-y-2">
                        {Object.entries(selectedResource.specifications).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                            <span className="text-sm text-gray-900">
                              {Array.isArray(value) ? value.join(', ') : value.toString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Disponibilidad:</label>
                    <div className="mt-2 grid grid-cols-7 gap-1">
                      {Object.entries(selectedResource.availability).map(([day, available]) => (
                        <div
                          key={day}
                          className={`text-center p-2 rounded text-xs ${
                            available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                {selectedResource.status === 'disponible' && (
                  <button
                    onClick={() => handleReserveResource(selectedResource.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                  >
                    Reservar Recurso
                  </button>
                )}
                <button
                  onClick={() => handleEditResource(selectedResource)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Editar
                </button>
                <button
                  onClick={() => setSelectedResource(null)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceManagementPage;
