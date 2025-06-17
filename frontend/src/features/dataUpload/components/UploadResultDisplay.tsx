import React from 'react';

interface UploadError {
  row: number;
  data: any;
  type: string;
  field: string;
  message: string;
}

interface UploadResult {
  success: boolean;
  message: string;
  summary?: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    errors?: (string | UploadError)[];
  };
  data?: any;
}

interface UploadResultDisplayProps {
  result: UploadResult;
  onClose?: () => void;
  className?: string;
}

const UploadResultDisplay: React.FC<UploadResultDisplayProps> = ({
  result,
  onClose,
  className = ''
}) => {
  const { success, message, summary } = result;

  return (
    <div className={`upload-result-display ${className}`}>
      <div className={`p-4 rounded-lg border ${
        success 
          ? 'border-green-200 bg-green-50' 
          : 'border-red-200 bg-red-50'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className={`flex items-center ${
            success ? 'text-green-700' : 'text-red-700'
          }`}>
            <span className="mr-2 text-xl">
              {success ? '✅' : '❌'}
            </span>
            <h4 className="font-semibold">{message}</h4>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          )}
        </div>
        
        {/* Summary Statistics */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-white rounded shadow-sm">
              <div className="text-2xl font-bold text-blue-600">
                {summary.totalRecords}
              </div>
              <div className="text-sm text-gray-600">Total Registros</div>
            </div>
            <div className="text-center p-3 bg-white rounded shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {summary.validRecords}
              </div>
              <div className="text-sm text-gray-600">Válidos</div>
            </div>
            <div className="text-center p-3 bg-white rounded shadow-sm">
              <div className="text-2xl font-bold text-red-600">
                {summary.invalidRecords}
              </div>
              <div className="text-sm text-gray-600">Con Errores</div>
            </div>
          </div>
        )}

        {/* Success Rate Bar */}
        {summary && summary.totalRecords > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Tasa de éxito</span>
              <span>{Math.round((summary.validRecords / summary.totalRecords) * 100)}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(summary.validRecords / summary.totalRecords) * 100}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Error List */}
        {summary?.errors && summary.errors.length > 0 && (
          <div className="mt-4">
            <h5 className="font-semibold text-red-700 mb-2 flex items-center">
              <span className="mr-1">⚠️</span>
              Errores encontrados ({summary.errors.length}):
            </h5>            <div className="bg-red-50 border border-red-200 p-3 rounded max-h-40 overflow-y-auto">
              <ul className="text-sm text-red-700 space-y-1">                {summary.errors.slice(0, 10).map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2 text-red-500 flex-shrink-0">•</span>
                    <span>
                      {typeof error === 'string' 
                        ? error 
                        : (
                          <div>
                            <div className="font-medium">
                              Fila {error.row}: {error.message}
                            </div>
                            <div className="text-xs text-red-500 mt-1">
                              Campo: {error.field} | Tipo: {error.type}
                            </div>
                          </div>
                        )
                      }
                    </span>
                  </li>
                ))}
                {summary.errors.length > 10 && (
                  <li className="text-red-600 font-medium">
                    ... y {summary.errors.length - 10} errores más
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex justify-end space-x-2">
          {summary?.errors && summary.errors.length > 0 && (
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              📥 Descargar Reporte de Errores
            </button>
          )}
          {success && summary && summary.validRecords > 0 && (
            <button className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
              📊 Ver Datos Procesados
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadResultDisplay;
