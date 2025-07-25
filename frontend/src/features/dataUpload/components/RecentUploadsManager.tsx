import React, { useState, useEffect } from 'react';
import { uploadService, RecentUpload, UploadDetails, DataRecord } from '../services/upload.service';
import { BimestreService, Bimestre } from '../../../services/bimestre.service';
import { useToast } from '../../../hooks/useToast';

interface RecentUploadsManagerProps {
  onRefresh?: () => void;
}

const RecentUploadsManager: React.FC<RecentUploadsManagerProps> = ({ onRefresh }) => {
  const [uploads, setUploads] = useState<RecentUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<RecentUpload | null>(null);
  const [uploadDetails, setUploadDetails] = useState<UploadDetails | null>(null);
  const [dataFilter, setDataFilter] = useState<'all' | 'valid' | 'errors'>('all');
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [comments, setComments] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(20);
  const [bimestres, setBimestres] = useState<Bimestre[]>([]);
  const [selectedBimestreId, setSelectedBimestreId] = useState<number | undefined>(undefined);
  const { showToast } = useToast();
  const bimestreService = new BimestreService();

  useEffect(() => {
    loadBimestres();
    loadRecentUploads();
  }, []);

  useEffect(() => {
    loadRecentUploads();
  }, [selectedBimestreId]);

  const handleFilterChange = (newFilter: 'all' | 'valid' | 'errors') => {
    setDataFilter(newFilter);
    setCurrentPage(1); // Resetear a la primera página cuando cambie el filtro
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const loadBimestres = async () => {
    try {
      const data = await bimestreService.findActivos();
      setBimestres(data);
    } catch (error: any) {
      console.error('Error al cargar bimestres:', error);
    }
  };

  const loadRecentUploads = async () => {
    try {
      setLoading(true);
      const data = await uploadService.getRecentUploads(selectedBimestreId);
      setUploads(data);
    } catch (error: any) {
      showToast(error.message || 'Error al cargar las cargas recientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (upload: RecentUpload, action: 'approve' | 'reject') => {
    setSelectedUpload(upload);
    setApprovalAction(action);
    setComments('');
    setShowApprovalModal(true);
  };

  const handleViewData = async (upload: RecentUpload) => {
    try {
      setSelectedUpload(upload);
      const details = await uploadService.getUploadDetails(upload.id.toString());
      
      setUploadDetails(details);
      setCurrentPage(1); // Resetear a la primera página
      setDataFilter('all');
      setShowDataModal(true);
    } catch (error: any) {
      showToast(error.message || 'Error al cargar los detalles de la carga', 'error');
    }
  };

  const confirmApprovalAction = async () => {
    if (!selectedUpload) return;

    try {
      setProcessingId(selectedUpload.id);
      
      if (approvalAction === 'approve') {
        await uploadService.approveUpload(selectedUpload.id, comments);
        showToast('Carga aprobada exitosamente', 'success');
      } else {
        await uploadService.rejectUpload(selectedUpload.id, comments);
        showToast('Carga rechazada exitosamente', 'success');
      }
      
      await loadRecentUploads();
      if (onRefresh) onRefresh();
    } catch (error: any) {
      showToast(error.message || 'Error al procesar la acción', 'error');
    } finally {
      setProcessingId(null);
      setShowApprovalModal(false);
      setSelectedUpload(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      'Exitoso': 'bg-green-100 text-green-800',
      'Con errores': 'bg-yellow-100 text-yellow-800',
      'Error': 'bg-red-100 text-red-800'
    };
    return statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800';
  };

  const getApprovalStatusBadge = (status: string) => {
    const statusClasses = {
      'Pendiente': 'bg-blue-100 text-blue-800',
      'Aprobado': 'bg-green-100 text-green-800',
      'Rechazado': 'bg-red-100 text-red-800'
    };
    return statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatUploadType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'ESTRUCTURA_ACADEMICA': 'Estructura Académica',
      'NOMINA_DOCENTES': 'Nómina de Docentes',
      'REPORTE_CURSABLES': 'Reporte de Cursables',
      'ADOL': 'ADOL',
      'DOL': 'DOL',
      'VACANTES_INICIO': 'Vacantes de Inicio',
      'PAYMENT_CODES': 'Códigos de Pago'
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cargas Recientes</h3>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Cargas Recientes</h3>
            <button
              onClick={loadRecentUploads}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Actualizar
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="bimestre-filter" className="text-sm font-medium text-gray-700">
                Filtrar por bimestre:
              </label>
              <select
                id="bimestre-filter"
                value={selectedBimestreId || ''}
                onChange={(e) => setSelectedBimestreId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Todos los bimestres</option>
                {bimestres.map((bimestre) => (
                  <option key={bimestre.id} value={bimestre.id}>
                    {bimestre.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Archivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bimestre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aprobación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registros
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {uploads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No hay cargas recientes
                  </td>
                </tr>
              ) : (
                uploads.map((upload) => (
                  <tr key={upload.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {upload.file_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatUploadType(upload.upload_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(upload.upload_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {upload.bimestre || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(upload.status)}`}>
                        {upload.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getApprovalStatusBadge(upload.approval_status)}`}>
                        {upload.approval_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {upload.error_count > 0 
                        ? `${upload.total_records} (${upload.error_count} errores)`
                        : upload.total_records
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewData(upload)}
                        disabled={upload.approval_status === 'Aprobado'}
                        className={`${
                          upload.approval_status === 'Aprobado'
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-blue-600 hover:text-blue-900'
                        }`}
                      >
                        Ver
                      </button>
                      {upload.approval_status === 'Pendiente' && !upload.is_processed && (
                        <button
                          onClick={() => handleApprovalAction(upload, 'approve')}
                          disabled={processingId === upload.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          {processingId === upload.id ? 'Procesando...' : 'Aprobar'}
                        </button>
                      )}
                      {upload.approval_status === 'Aprobado' && (
                        <span className="text-green-600 font-medium">Aprobado</span>
                      )}
                      {upload.approval_status === 'Rechazado' && (
                        <span className="text-red-600 font-medium">Rechazado</span>
                      )}
                      {upload.is_processed && (
                        <span className="text-gray-500 font-medium">Procesado</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de confirmación de aprobación/rechazo */}
      {showApprovalModal && selectedUpload && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {approvalAction === 'approve' ? 'Aprobar Carga' : 'Rechazar Carga'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                ¿Estás seguro de que deseas {approvalAction === 'approve' ? 'aprobar' : 'rechazar'} la carga del archivo <strong>{selectedUpload.file_name}</strong>?
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentarios (opcional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Agregar comentarios sobre la decisión..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmApprovalAction}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    approvalAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {approvalAction === 'approve' ? 'Aprobar' : 'Rechazar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualización de datos */}
      {showDataModal && selectedUpload && uploadDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-0 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            {/* Header del modal */}
            <div className="flex justify-between items-start p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📄</span>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedUpload.file_name}</h3>
                  <p className="text-sm text-gray-600">
                    Tipo: {formatUploadType(selectedUpload.upload_type)} | Bimestre: {selectedUpload.bimestre}
                  </p>
                  <p className="text-sm text-gray-600">
                    Cargado: {formatDate(selectedUpload.upload_date)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDataModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Filtros de datos */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex space-x-4">
                <button
                  onClick={() => handleFilterChange('all')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    dataFilter === 'all'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ○ Todos ({selectedUpload.total_records})
                </button>
                <button
                  onClick={() => handleFilterChange('valid')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    dataFilter === 'valid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ○ Válidos ({selectedUpload.total_records - selectedUpload.error_count})
                </button>
                <button
                  onClick={() => handleFilterChange('errors')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    dataFilter === 'errors'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ○ Con Errores ({selectedUpload.error_count})
                </button>
              </div>
            </div>

            {/* Contenido de datos */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {(() => {
                let dataToShow: DataRecord[] = [];
                
                if (dataFilter === 'all') {
                  dataToShow = [...(uploadDetails.validRecords || []), ...(uploadDetails.invalidRecords || [])];
                } else if (dataFilter === 'valid') {
                  dataToShow = uploadDetails.validRecords || [];
                } else if (dataFilter === 'errors') {
                  dataToShow = uploadDetails.invalidRecords || [];
                }

                if (dataToShow.length === 0) {
                  return (
                    <div className="text-center text-gray-500 py-8">
                      No hay datos para mostrar con el filtro seleccionado
                    </div>
                  );
                }

                // Cálculos de paginación
                const totalRecords = dataToShow.length;
                const totalPages = Math.ceil(totalRecords / recordsPerPage);
                const startIndex = (currentPage - 1) * recordsPerPage;
                const endIndex = startIndex + recordsPerPage;
                const currentRecords = dataToShow.slice(startIndex, endIndex);

                // Obtener las columnas de los datos (excluyendo ID_BIMESTRE)
                const columns = dataToShow.length > 0 
                  ? Object.keys(dataToShow[0].data).filter(column => column !== 'ID_BIMESTRE')
                  : [];

                return (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fila
                          </th>
                          {columns.map((column) => (
                            <th key={column} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {column}
                            </th>
                          ))}
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentRecords.map((record, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {record.rowNumber}
                            </td>
                            {columns.map((column) => (
                              <td key={column} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                {record.data[column] || 'N/A'}
                              </td>
                            ))}
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                              {record.errors && record.errors.length > 0 ? (
                                <span className="text-red-500" title={record.errors.join(', ')}>⚠️</span>
                              ) : (
                                <span className="text-green-500">✅</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Footer del modal con paginación */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              {(() => {
                let dataToShow: DataRecord[] = [];
                
                if (dataFilter === 'all') {
                  dataToShow = [...(uploadDetails.validRecords || []), ...(uploadDetails.invalidRecords || [])];
                } else if (dataFilter === 'valid') {
                  dataToShow = uploadDetails.validRecords || [];
                } else if (dataFilter === 'errors') {
                  dataToShow = uploadDetails.invalidRecords || [];
                }

                const totalRecords = dataToShow.length;
                const totalPages = Math.ceil(totalRecords / recordsPerPage);
                const startRecord = (currentPage - 1) * recordsPerPage + 1;
                const endRecord = Math.min(currentPage * recordsPerPage, totalRecords);

                return (
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      Mostrando {startRecord} - {endRecord} de {totalRecords} registros
                    </p>
                    
                    {totalPages > 1 && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Anterior
                        </button>
                        
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNumber;
                            if (totalPages <= 5) {
                              pageNumber = i + 1;
                            } else if (currentPage <= 3) {
                              pageNumber = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNumber = totalPages - 4 + i;
                            } else {
                              pageNumber = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNumber}
                                onClick={() => handlePageChange(pageNumber)}
                                className={`px-3 py-1 text-sm rounded-md ${
                                  currentPage === pageNumber
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          })}
                        </div>
                        
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecentUploadsManager;