import React, { useState, useEffect } from 'react';
import { uploadService, UploadHistoryItem } from '../services/upload.service';
import { BimestreService, Bimestre } from '../../../services/bimestre.service';
import { useToast } from '../../../hooks/useToast';

interface UploadHistoryManagerProps {
  onRefresh?: () => void;
}

const UploadHistoryManager: React.FC<UploadHistoryManagerProps> = ({ onRefresh }) => {
  const [uploads, setUploads] = useState<UploadHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filters, setFilters] = useState({
    uploadType: '',
    status: '',
    bimestreId: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<UploadHistoryItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [bimestres, setBimestres] = useState<Bimestre[]>([]);
  const { showToast } = useToast();
  const bimestreService = new BimestreService();

  const itemsPerPage = 20;

  useEffect(() => {
    loadBimestres();
    loadUploadHistory();
  }, [currentPage, filters]);

  const loadBimestres = async () => {
    try {
      const bimestresData = await bimestreService.findAll();
      setBimestres(bimestresData);
    } catch (error: any) {
      console.error('Error al cargar bimestres:', error);
    }
  };

  const loadUploadHistory = async () => {
    try {
      setLoading(true);
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      
      const data = await uploadService.getUploadHistory(currentPage, itemsPerPage, cleanFilters);
      setUploads(data.uploads);
      setTotalRecords(data.total);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
    } catch (error: any) {
      showToast(error.message || 'Error al cargar el historial de cargas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      uploadType: '',
      status: '',
      bimestreId: ''
    });
    setCurrentPage(1);
  };

  const showUploadDetails = (upload: UploadHistoryItem) => {
    setSelectedUpload(upload);
    setShowDetailsModal(true);
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

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-2 text-sm font-medium ${
            i === currentPage
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          } border border-gray-300`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-700">
          Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalRecords)} de {totalRecords} registros
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          {pages}
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Historial de Cargas</h3>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </button>
              <button
                onClick={loadUploadHistory}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Actualizar
              </button>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={filters.uploadType}
                  onChange={(e) => handleFilterChange('uploadType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="ESTRUCTURA_ACADEMICA">Estructura Académica</option>
                  <option value="NOMINA_DOCENTES">Nómina de Docentes</option>
                  <option value="REPORTE_CURSABLES">Reporte de Cursables</option>
                  <option value="ADOL">ADOL</option>
                  <option value="DOL">DOL</option>
                  <option value="VACANTES_INICIO">Vacantes de Inicio</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="Exitoso">Exitoso</option>
                  <option value="Con errores">Con errores</option>
                  <option value="Error">Error</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bimestre</label>
                <select
                  value={filters.bimestreId}
                  onChange={(e) => handleFilterChange('bimestreId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  {bimestres.map((bimestre) => (
                    <option key={bimestre.id} value={bimestre.id}>
                      {bimestre.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          <>
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
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {uploads.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                        No se encontraron cargas
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {upload.user_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => showUploadDetails(upload)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Ver Detalles
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && renderPagination()}
          </>
        )}
      </div>

      {/* Modal de detalles */}
      {showDetailsModal && selectedUpload && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2/3 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Detalles de Carga
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Archivo</label>
                  <p className="text-sm text-gray-900">{selectedUpload.file_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <p className="text-sm text-gray-900">{formatUploadType(selectedUpload.upload_type)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Carga</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedUpload.upload_date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bimestre</label>
                  <p className="text-sm text-gray-900">{selectedUpload.bimestre || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedUpload.status)}`}>
                    {selectedUpload.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado de Aprobación</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getApprovalStatusBadge(selectedUpload.approval_status)}`}>
                    {selectedUpload.approval_status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total de Registros</label>
                  <p className="text-sm text-gray-900">{selectedUpload.total_records}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Errores</label>
                  <p className="text-sm text-gray-900">{selectedUpload.error_count}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Usuario</label>
                  <p className="text-sm text-gray-900">{selectedUpload.user_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Procesado</label>
                  <p className="text-sm text-gray-900">{selectedUpload.is_processed ? 'Sí' : 'No'}</p>
                </div>
                {selectedUpload.approved_by_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Aprobado por</label>
                    <p className="text-sm text-gray-900">{selectedUpload.approved_by_name}</p>
                  </div>
                )}
                {selectedUpload.approved_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Aprobación</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedUpload.approved_at)}</p>
                  </div>
                )}
              </div>
              
              {selectedUpload.error_details && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Detalles de Errores</label>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap">{selectedUpload.error_details}</pre>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UploadHistoryManager;