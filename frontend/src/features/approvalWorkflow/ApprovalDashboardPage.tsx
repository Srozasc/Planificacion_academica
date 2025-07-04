import React, { useState, useEffect } from 'react';
import { approvalService, ApprovalRequest, ApprovalStats, ApprovalFilters, ApprovalAction } from './services/approval.service';
import ApprovalQueue from './components/ApprovalQueue';
import EventStatusIndicator from './components/EventStatusIndicator';

const ApprovalDashboardPage: React.FC = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ApprovalFilters>({});
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processAction, setProcessAction] = useState<'approve' | 'reject' | null>(null);
  const [processComments, setProcessComments] = useState('');

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [requestsData, statsData] = await Promise.all([
        approvalService.getApprovalRequests(filters),
        approvalService.getApprovalStats()
      ]);
      setRequests(requestsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading approval data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessApproval = async (id: string, action: ApprovalAction) => {
    try {
      const updatedRequest = await approvalService.processApproval(id, action);
      setRequests(prev => prev.map(req => req.id === id ? updatedRequest : req));
      await loadData(); // Recargar estadísticas
    } catch (error) {
      console.error('Error processing approval:', error);
      alert('Error al procesar la solicitud');
    }
  };

  const handleViewDetails = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleProcessFromModal = async () => {
    if (!selectedRequest || !processAction) return;
    
    const action: ApprovalAction = {
      action: processAction,
      comments: processComments || undefined
    };
    
    await handleProcessApproval(selectedRequest.id, action);
    setShowProcessModal(false);
    setShowDetailsModal(false);
    setProcessAction(null);
    setProcessComments('');
  };

  const openProcessModal = (action: 'approve' | 'reject') => {
    setProcessAction(action);
    setShowProcessModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistema de Aprobaciones</h1>
        <p className="text-gray-600">Gestiona las solicitudes pendientes de aprobación</p>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl text-blue-600 mr-4">📊</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl text-yellow-600 mr-4">⏳</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl text-blue-600 mr-4">👁️</div>
              <div>
                <p className="text-sm font-medium text-gray-600">En Revisión</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inReview}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl text-green-600 mr-4">✅</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Aprobadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl text-red-600 mr-4">❌</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Rechazadas</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl text-orange-600 mr-4">⚠️</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Vencidas</p>
                <p className="text-2xl font-bold text-orange-600">{stats.overdue}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="in_review">En Revisión</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <select
              value={filters.type || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value || undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los tipos</option>
              <option value="schedule_change">Cambio de Horario</option>
              <option value="resource_allocation">Asignación de Recursos</option>
              <option value="course_creation">Creación de Curso</option>
              <option value="instructor_assignment">Asignación de Instructor</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
            <select
              value={filters.priority || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value || undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las prioridades</option>
              <option value="urgent">Urgente</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <input
              type="text"
              placeholder="Buscar por título o descripción..."
              value={filters.search || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value || undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setFilters({})}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Limpiar Filtros
          </button>
          <button
            onClick={loadData}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Cola de Aprobaciones */}
      <ApprovalQueue
        requests={requests}
        onProcessApproval={handleProcessApproval}
        onViewDetails={handleViewDetails}
        loading={loading}
      />

      {/* Modal de Detalles */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">Detalles de la Solicitud</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedRequest.title}</h3>
                <EventStatusIndicator status={selectedRequest.status} />
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Descripción</h4>
                <p className="text-gray-600">{selectedRequest.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Solicitante</h4>
                  <p className="text-gray-900">{selectedRequest.requestedBy.name}</p>
                  <p className="text-sm text-gray-600">{selectedRequest.requestedBy.email}</p>
                  <p className="text-sm text-gray-600">{selectedRequest.requestedBy.role}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Información</h4>
                  <p className="text-sm text-gray-600">Tipo: {selectedRequest.type}</p>
                  <p className="text-sm text-gray-600">Prioridad: {selectedRequest.priority}</p>
                  <p className="text-sm text-gray-600">Creado: {formatDate(selectedRequest.createdAt)}</p>
                  {selectedRequest.dueDate && (
                    <p className="text-sm text-gray-600">Vence: {formatDate(selectedRequest.dueDate)}</p>
                  )}
                </div>
              </div>
              
              {selectedRequest.approvedBy && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Aprobado por</h4>
                  <p className="text-gray-900">{selectedRequest.approvedBy.name}</p>
                  <p className="text-sm text-gray-600">{selectedRequest.approvedAt && formatDate(selectedRequest.approvedAt)}</p>
                </div>
              )}
              
              {selectedRequest.rejectionReason && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Motivo de Rechazo</h4>
                  <p className="text-red-600">{selectedRequest.rejectionReason}</p>
                </div>
              )}
            </div>
            
            {selectedRequest.status === 'pending' && (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => openProcessModal('approve')}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  ✅ Aprobar
                </button>
                <button
                  onClick={() => openProcessModal('reject')}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  ❌ Rechazar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Procesamiento */}
      {showProcessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {processAction === 'approve' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentarios {processAction === 'reject' ? '(requerido)' : '(opcional)'}
              </label>
              <textarea
                value={processComments}
                onChange={(e) => setProcessComments(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={processAction === 'approve' ? 'Comentarios adicionales...' : 'Explica el motivo del rechazo...'}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleProcessFromModal}
                disabled={processAction === 'reject' && !processComments.trim()}
                className={`px-4 py-2 text-white rounded ${
                  processAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {processAction === 'approve' ? '✅ Confirmar Aprobación' : '❌ Confirmar Rechazo'}
              </button>
              <button
                onClick={() => {
                  setShowProcessModal(false);
                  setProcessAction(null);
                  setProcessComments('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalDashboardPage;