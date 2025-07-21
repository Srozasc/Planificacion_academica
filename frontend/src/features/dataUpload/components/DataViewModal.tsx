import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { uploadService, UploadDetails, DataRecord } from '../services/upload.service';

interface DataViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadId: string;
}

type FilterType = 'all' | 'valid' | 'invalid';

const DataViewModal: React.FC<DataViewModalProps> = ({ isOpen, onClose, uploadId }) => {
  console.log('=== DEBUG: DataViewModal renderizado ===');
  console.log('Props recibidas - isOpen:', isOpen, 'uploadId:', uploadId);
  
  const [uploadDetails, setUploadDetails] = useState<UploadDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    console.log('=== DEBUG: useEffect ejecutado ===');
    console.log('isOpen:', isOpen);
    console.log('uploadId:', uploadId);
    if (isOpen && uploadId) {
      console.log('=== DEBUG: Llamando fetchUploadDetails ===');
      fetchUploadDetails();
    }
  }, [isOpen, uploadId]);

  const fetchUploadDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const details = await uploadService.getUploadDetails(uploadId);
      console.log('=== DEBUG: Detalles recibidos del backend ===');
      console.log('Details completos:', details);
      console.log('validRecords:', details.validRecords);
      console.log('invalidRecords:', details.invalidRecords);
      console.log('validRecords length:', details.validRecords?.length);
      console.log('invalidRecords length:', details.invalidRecords?.length);
      setUploadDetails(details);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRecords = (): DataRecord[] => {
    if (!uploadDetails) {
      console.log('=== DEBUG: No hay uploadDetails ===');
      return [];
    }
    
    console.log('=== DEBUG: getFilteredRecords ===');
    console.log('Filter actual:', filter);
    console.log('uploadDetails.validRecords:', uploadDetails.validRecords);
    console.log('uploadDetails.invalidRecords:', uploadDetails.invalidRecords);
    
    let result;
    switch (filter) {
      case 'valid':
        result = uploadDetails.validRecords || [];
        break;
      case 'invalid':
        result = uploadDetails.invalidRecords || [];
        break;
      default:
        result = [...(uploadDetails.validRecords || []), ...(uploadDetails.invalidRecords || [])];
        break;
    }
    
    console.log('Resultado filtrado:', result);
    console.log('Resultado filtrado length:', result.length);
    return result;
  };

  const getColumnNames = (): string[] => {
    const records = getFilteredRecords();
    if (records.length === 0) return [];
    
    // Get all unique column names from the first few records
    const columns = new Set<string>();
    records.slice(0, 5).forEach(record => {
      if (record.data) {
        Object.keys(record.data).forEach(key => columns.add(key));
      }
    });
    
    return Array.from(columns);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="absolute inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[75vh] flex flex-col mb-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Visualización de Datos
            </h2>
            {uploadDetails && (
              <p className="text-sm text-gray-600 mt-1">
                {uploadDetails.filename} - {uploadDetails.type} - {uploadDetails.date}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Cargando datos...</span>
            </div>
          )}

          {error && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{error}</p>
                <button
                  onClick={fetchUploadDetails}
                  className="mt-2 text-red-600 hover:text-red-800 underline"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {uploadDetails && !loading && !error && (
            <div className="p-6">
              {/* Summary */}
              <div className="mb-6 grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total de Registros</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {(uploadDetails.validRecords?.length || 0) + (uploadDetails.invalidRecords?.length || 0)}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Registros Válidos</p>
                  <p className="text-2xl font-bold text-green-900">
                    {uploadDetails.validRecords?.length || 0}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Registros con Errores</p>
                  <p className="text-2xl font-bold text-red-900">
                    {uploadDetails.invalidRecords?.length || 0}
                  </p>
                </div>
              </div>

              {/* Filter */}
              <div className="mb-4">
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="filter"
                      value="all"
                      checked={filter === 'all'}
                      onChange={(e) => setFilter(e.target.value as FilterType)}
                      className="mr-2"
                    />
                    Todos los registros
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="filter"
                      value="valid"
                      checked={filter === 'valid'}
                      onChange={(e) => setFilter(e.target.value as FilterType)}
                      className="mr-2"
                    />
                    Solo válidos
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="filter"
                      value="invalid"
                      checked={filter === 'invalid'}
                      onChange={(e) => setFilter(e.target.value as FilterType)}
                      className="mr-2"
                    />
                    Solo con errores
                  </label>
                </div>
              </div>

              {/* Data Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fila
                        </th>
                        {getColumnNames().map((column) => (
                          <th
                            key={column}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {column}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredRecords().map((record, index) => (
                        <tr key={index} className={record.errors && record.errors.length > 0 ? 'bg-red-50' : ''}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {record.rowNumber}
                          </td>
                          {getColumnNames().map((column) => (
                            <td key={column} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {record.data?.[column] || '-'}
                            </td>
                          ))}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {record.errors && record.errors.length > 0 ? (
                              <div className="group relative">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 cursor-help">
                                  Error
                                </span>
                                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                                  <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 max-w-xs">
                                    {(record.errors || []).map((error, errorIndex) => (
                                      <div key={errorIndex} className="mb-1 last:mb-0">
                                        {error}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Válido
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {getFilteredRecords().length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No hay registros para mostrar con el filtro seleccionado.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataViewModal;