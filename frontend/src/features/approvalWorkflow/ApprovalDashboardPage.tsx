import React, { useState } from 'react';
import { 
  ClockIcon, 
  CheckIcon, 
  XMarkIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
  ChartBarIcon,
  AcademicCapIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

interface ApprovalItem {
  id: string;
  title: string;
  type: 'horario' | 'curso' | 'docente' | 'aula' | 'programa';
  requestedBy: string;
  requestedAt: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected';
  description: string;
  details?: Record<string, any>;
}

const ApprovalDashboardPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<string>('pending');
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);

  const mockApprovals: ApprovalItem[] = [
    {
      id: '1',
      title: 'Horario Matemáticas I - Sección A',
      type: 'horario',
      requestedBy: 'Dr. García',
      requestedAt: '2024-01-15T10:30:00Z',
      priority: 'high',
      status: 'pending',
      description: 'Solicitud de cambio de horario para el curso de Matemáticas I',
      details: {
        curso: 'Matemáticas I',
        seccion: 'A',
        horarioActual: 'L-M-V 8:00-10:00',
        horarioPropuesto: 'L-M-V 10:00-12:00',
        aula: 'Aula 101'
      }
    },
    {
      id: '2',
      title: 'Nuevo Curso: Inteligencia Artificial',
      type: 'curso',
      requestedBy: 'Dra. López',
      requestedAt: '2024-01-14T15:45:00Z',
      priority: 'medium',
      status: 'pending',
      description: 'Propuesta para nuevo curso de posgrado',
      details: {
        codigo: 'IA-501',
        creditos: 4,
        prerrequisitos: ['Programación Avanzada', 'Estadística'],
        modalidad: 'Presencial'
      }
    },
    {
      id: '3',
      title: 'Asignación Docente - Prof. Martínez',
      type: 'docente',
      requestedBy: 'Coordinador Sistemas',
      requestedAt: '2024-01-13T09:15:00Z',
      priority: 'low',
      status: 'approved',
      description: 'Asignación de carga académica para el próximo semestre',
      details: {
        docente: 'Prof. Martínez',
        cursos: ['Base de Datos', 'Sistemas Operativos'],
        horasSemanales: 20
      }
    },
    {
      id: '4',
      title: 'Reserva Laboratorio de Física',
      type: 'aula',
      requestedBy: 'Dr. Rodríguez',
      requestedAt: '2024-01-12T14:20:00Z',
      priority: 'medium',
      status: 'rejected',
      description: 'Solicitud de uso exclusivo del laboratorio',
      details: {
        laboratorio: 'Lab. Física 1',
        fechas: '15-19 Enero 2024',
        horario: '14:00-18:00',
        motivo: 'Experimento especial'
      }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'horario': return <ClockIcon className="h-5 w-5" />;
      case 'curso': return <AcademicCapIcon className="h-5 w-5" />;
      case 'docente': return <UserIcon className="h-5 w-5" />;
      case 'aula': return <BuildingOfficeIcon className="h-5 w-5" />;
      case 'programa': return <DocumentTextIcon className="h-5 w-5" />;
      default: return <DocumentTextIcon className="h-5 w-5" />;
    }
  };

  const filteredApprovals = mockApprovals.filter(item => {
    if (selectedTab === 'all') return true;
    return item.status === selectedTab;
  });

  const handleApprove = (id: string) => {
    console.log(`Aprobar solicitud: ${id}`);
    // Aquí iría la lógica real de aprobación
  };

  const handleReject = (id: string) => {
    console.log(`Rechazar solicitud: ${id}`);
    // Aquí iría la lógica real de rechazo
  };

  const getStatusStats = () => {
    const pending = mockApprovals.filter(item => item.status === 'pending').length;
    const approved = mockApprovals.filter(item => item.status === 'approved').length;
    const rejected = mockApprovals.filter(item => item.status === 'rejected').length;
    return { pending, approved, rejected, total: mockApprovals.length };
  };

  const stats = getStatusStats();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistema de Aprobaciones</h1>
          <p className="text-gray-600">Gestiona las solicitudes pendientes de aprobación</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aprobadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XMarkIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rechazadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Aprobaciones */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {[
                    { key: 'pending', label: 'Pendientes', count: stats.pending },
                    { key: 'approved', label: 'Aprobadas', count: stats.approved },
                    { key: 'rejected', label: 'Rechazadas', count: stats.rejected },
                    { key: 'all', label: 'Todas', count: stats.total }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedTab(tab.key)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        selectedTab === tab.key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </nav>
              </div>

              {/* Lista */}
              <div className="divide-y divide-gray-200">
                {filteredApprovals.map(item => (
                  <div key={item.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-1 bg-gray-100 rounded">
                            {getTypeIcon(item.type)}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                            {item.status === 'pending' ? 'Pendiente' : 
                             item.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(item.priority)}`}>
                            {item.priority === 'high' ? 'Alta' : 
                             item.priority === 'medium' ? 'Media' : 'Baja'}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{item.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <UserIcon className="h-4 w-4" />
                            {item.requestedBy}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {new Date(item.requestedAt).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        
                        {item.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(item.id)}
                              className="p-2 text-green-600 hover:text-green-700 rounded-lg hover:bg-green-50"
                              title="Aprobar"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleReject(item.id)}
                              className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50"
                              title="Rechazar"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel de Detalles */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedItem ? 'Detalles de la Solicitud' : 'Selecciona una Solicitud'}
              </h3>
              
              {selectedItem ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Título:</label>
                    <p className="text-gray-900">{selectedItem.title}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tipo:</label>
                    <p className="text-gray-900 capitalize">{selectedItem.type}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Solicitado por:</label>
                    <p className="text-gray-900">{selectedItem.requestedBy}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Fecha:</label>
                    <p className="text-gray-900">
                      {new Date(selectedItem.requestedAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Descripción:</label>
                    <p className="text-gray-900">{selectedItem.description}</p>
                  </div>
                  
                  {selectedItem.details && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Detalles adicionales:</label>
                      <div className="mt-2 space-y-2">
                        {Object.entries(selectedItem.details).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-sm text-gray-600 capitalize">{key}:</span>
                            <span className="text-sm text-gray-900">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedItem.status === 'pending' && (
                    <div className="pt-4 border-t space-y-2">
                      <button
                        onClick={() => handleApprove(selectedItem.id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                      >
                        Aprobar Solicitud
                      </button>
                      <button
                        onClick={() => handleReject(selectedItem.id)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                      >
                        Rechazar Solicitud
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Haz clic en una solicitud para ver sus detalles</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalDashboardPage;
