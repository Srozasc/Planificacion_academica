import React, { useState } from 'react';
import { ApprovalRequest, ApprovalAction } from '../services/approval.service';
import EventStatusIndicator from './EventStatusIndicator';

interface ApprovalQueueProps {
  requests: ApprovalRequest[];
  onProcessApproval: (id: string, action: ApprovalAction) => void;
  onViewDetails: (request: ApprovalRequest) => void;
  loading?: boolean;
}

const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  requests,
  onProcessApproval,
  onViewDetails,
  loading = false
}) => {
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleSelectRequest = (id: string) => {
    setSelectedRequests(prev => 
      prev.includes(id) 
        ? prev.filter(reqId => reqId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRequests.length === requests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(requests.map(req => req.id));
    }
  };

  const handleProcessRequest = async (id: string, action: ApprovalAction) => {
    setProcessingId(id);
    try {
      await onProcessApproval(id, action);
    } finally {
      setProcessingId(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 font-bold';
      case 'high':
        return 'text-orange-600 font-semibold';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'schedule_change':
        return 'Cambio de Horario';
      case 'resource_allocation':
        return 'Asignación de Recursos';
      case 'course_creation':
        return 'Creación de Curso';
      case 'instructor_assignment':
        return 'Asignación de Instructor';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="text-gray-400 text-6xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay solicitudes</h3>
        <p className="text-gray-500">No se encontraron solicitudes de aprobación.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header con acciones en lote */}
      {selectedRequests.length > 0 && (
        <div className="border-b border-gray-200 p-4 bg-blue-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedRequests.length} solicitud(es) seleccionada(s)
            </span>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                onClick={() => {
                  // Implementar aprobación en lote
                  console.log('Aprobar seleccionadas:', selectedRequests);
                }}
              >
                ✅ Aprobar Todas
              </button>
              <button
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                onClick={() => {
                  // Implementar rechazo en lote
                  console.log('Rechazar seleccionadas:', selectedRequests);
                }}
              >
                ❌ Rechazar Todas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de solicitudes */}
      <div className="divide-y divide-gray-200">
        {/* Header de la tabla */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedRequests.length === requests.length}
              onChange={handleSelectAll}
              className="mr-4 h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <div className="grid grid-cols-12 gap-4 w-full text-sm font-medium text-gray-700">
              <div className="col-span-4">Solicitud</div>
              <div className="col-span-2">Tipo</div>
              <div className="col-span-2">Solicitante</div>
              <div className="col-span-1">Prioridad</div>
              <div className="col-span-1">Estado</div>
              <div className="col-span-2">Acciones</div>
            </div>
          </div>
        </div>

        {requests.map((request) => (
          <div key={request.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedRequests.includes(request.id)}
                onChange={() => handleSelectRequest(request.id)}
                className="mr-4 h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <div className="grid grid-cols-12 gap-4 w-full">
                {/* Solicitud */}
                <div className="col-span-4">
                  <h4 className="font-medium text-gray-900 mb-1">{request.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{request.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Creado: {formatDate(request.createdAt)}
                  </p>
                  {request.dueDate && (
                    <p className="text-xs text-red-600 mt-1">
                      Vence: {formatDate(request.dueDate)}
                    </p>
                  )}
                </div>

                {/* Tipo */}
                <div className="col-span-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {getTypeLabel(request.type)}
                  </span>
                </div>

                {/* Solicitante */}
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-900">{request.requestedBy.name}</p>
                  <p className="text-xs text-gray-500">{request.requestedBy.role}</p>
                </div>

                {/* Prioridad */}
                <div className="col-span-1">
                  <span className={`text-sm font-medium ${getPriorityColor(request.priority)}`}>
                    {request.priority.toUpperCase()}
                  </span>
                </div>

                {/* Estado */}
                <div className="col-span-1">
                  <EventStatusIndicator status={request.status} size="sm" />
                </div>

                {/* Acciones */}
                <div className="col-span-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => onViewDetails(request)}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      title="Ver detalles"
                    >
                      👁️
                    </button>
                    
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleProcessRequest(request.id, { action: 'approve' })}
                          disabled={processingId === request.id}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                          title="Aprobar"
                        >
                          {processingId === request.id ? '⏳' : '✅'}
                        </button>
                        <button
                          onClick={() => handleProcessRequest(request.id, { action: 'reject', comments: 'Rechazado desde la cola' })}
                          disabled={processingId === request.id}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                          title="Rechazar"
                        >
                          {processingId === request.id ? '⏳' : '❌'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApprovalQueue;