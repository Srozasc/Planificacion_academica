import React, { useState, useEffect } from 'react';
import { uploadService } from './services/upload.service';

// Types
interface FileType {
  id: string;
  name: string;
  description: string;
  icon: string;
  format: string;
  templateName: string;
  endpoint: string;
}

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

interface RecentUpload {
  filename: string;
  type: string;
  date: string;
  status: 'Exitoso' | 'Con errores' | 'Error';
  records: number;
  errors?: number;
}

const DataUploadPage: React.FC = () => {
  const [selectedFileType, setSelectedFileType] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);

  const fileTypes: FileType[] = [
    {
      id: 'academic-structures',
      name: 'Estructura Académica',
      description: 'Información de programas, asignaturas y planes de estudio',
      icon: '🏛️',
      format: '.xlsx',
      templateName: 'estructura_academica_template.xlsx',
      endpoint: 'academic-structures'
    },
    {
      id: 'course-reports',
      name: 'Reporte de Cursables',
      description: 'Asignaturas disponibles para programar en el período',
      icon: '📚',
      format: '.xlsx',
      templateName: 'reporte_cursables_template.xlsx',
      endpoint: 'course-reports'
    },
    {
      id: 'teachers',
      name: 'Nómina de Docentes',
      description: 'Información de profesores y sus categorías',
      icon: '👨‍🏫',
      format: '.xlsx',
      templateName: 'nomina_docentes_template.xlsx',
      endpoint: 'teachers'
    },
    {
      id: 'payment-codes',
      name: 'Siglas de Pago',
      description: 'Códigos y factores de pago para docentes',
      icon: '💰',
      format: '.xlsx',
      templateName: 'siglas_pago_template.xlsx',
      endpoint: 'payment-codes'
    }
  ];

  // Load initial data
  useEffect(() => {
    loadSystemStats();
    loadRecentUploads();
  }, []);

  const loadSystemStats = async () => {
    try {
      const stats = await uploadService.getSystemStats();
      setSystemStats(stats);
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  const loadRecentUploads = () => {
    // Mock data for recent uploads - in real implementation, this would come from API
    const mockUploads: RecentUpload[] = [
      {
        filename: 'estructura_academica_2025.xlsx',
        type: 'Estructura Académica',
        date: '2025-06-14T10:30:00',
        status: 'Exitoso',
        records: 245
      },
      {
        filename: 'nomina_docentes_semestre1.xlsx',
        type: 'Nómina de Docentes',
        date: '2025-06-13T15:45:00',
        status: 'Con errores',
        records: 89,
        errors: 3
      },
      {
        filename: 'reporte_cursables_ing.xlsx',
        type: 'Reporte de Cursables',
        date: '2025-06-12T09:15:00',
        status: 'Exitoso',
        records: 156
      }
    ];
    setRecentUploads(mockUploads);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!selectedFileType) {
      alert('Por favor selecciona el tipo de archivo primero');
      return;
    }

    const fileType = fileTypes.find(t => t.id === selectedFileType);
    if (!fileType) {
      alert('Tipo de archivo no válido');
      return;
    }

    // Validate file
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert('Solo se permiten archivos Excel (.xlsx, .xls)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      alert('El archivo es demasiado grande. Máximo 10MB permitido.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Call upload service
      const result = await uploadService.uploadFile(fileType.endpoint, file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Wait a bit to show 100% progress
      setTimeout(() => {
        setIsUploading(false);
        setUploadResult(result);
        
        // Add to recent uploads
        const newUpload: RecentUpload = {
          filename: file.name,
          type: fileType.name,
          date: new Date().toISOString(),
          status: result.success ? 'Exitoso' : 'Con errores',
          records: result.summary?.totalRecords || 0,
          errors: result.summary?.invalidRecords || 0
        };
        
        setRecentUploads(prev => [newUpload, ...prev]);
        
        // Reload stats
        loadSystemStats();
      }, 1000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setUploadResult({
        success: false,
        message: 'Error al cargar el archivo. Por favor intenta nuevamente.',
        summary: {
          totalRecords: 0,
          validRecords: 0,
          invalidRecords: 0,
          errors: [error instanceof Error ? error.message : 'Error desconocido']
        }
      });
    }
  };

  const downloadTemplate = async (fileType: FileType) => {
    try {
      await uploadService.downloadTemplate(fileType.id);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Error al descargar la plantilla. Por favor intenta nuevamente.');
    }
  };

  const validateOnly = async (file: File) => {
    if (!selectedFileType) {
      alert('Por favor selecciona el tipo de archivo primero');
      return;
    }

    const fileType = fileTypes.find(t => t.id === selectedFileType);
    if (!fileType) return;

    try {
      setIsUploading(true);
      const result = await uploadService.validateFile(fileType.endpoint, file);
      setUploadResult({
        success: true,
        message: 'Validación completada',
        summary: result.summary
      });
    } catch (error) {
      console.error('Validation error:', error);
      setUploadResult({
        success: false,
        message: 'Error en la validación',
        summary: {
          totalRecords: 0,
          validRecords: 0,
          invalidRecords: 0,
          errors: [error instanceof Error ? error.message : 'Error en validación']
        }
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Exitoso':
        return 'bg-green-100 text-green-800';
      case 'Con errores':
        return 'bg-yellow-100 text-yellow-800';
      case 'Error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="data-upload-page p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Carga de Datos Maestros</h1>
        <p className="text-gray-600">
          Importa la información base del sistema mediante archivos Excel estructurados
        </p>
        {systemStats && (
          <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center">
              <span className="mr-1">📊</span>
              <span>Total archivos: {systemStats.total.files}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-1">💾</span>
              <span>Tamaño total: {(systemStats.total.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <div className="flex items-center">
              <span className="mr-1">✅</span>
              <span>Procesados: {systemStats.processed.files}</span>
            </div>
          </div>
        )}
      </div>

      {/* File Type Selection */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Seleccionar Tipo de Archivo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {fileTypes.map((type) => (
            <div
              key={type.id}
              onClick={() => setSelectedFileType(type.id)}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                selectedFileType === type.id
                  ? 'border-uc-blue bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-3">{type.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{type.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                <div className="text-xs text-gray-500">
                  Formato: <span className="font-medium">{type.format}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Area */}
      {selectedFileType && (
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Cargar {fileTypes.find(t => t.id === selectedFileType)?.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Arrastra tu archivo aquí o haz clic para seleccionar
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => {
                      const fileType = fileTypes.find(t => t.id === selectedFileType);
                      if (fileType) downloadTemplate(fileType);
                    }}
                    className="px-4 py-2 text-uc-blue border border-uc-blue rounded-lg hover:bg-blue-50 transition-colors duration-200"
                  >
                    <span className="mr-2">📥</span>
                    Descargar Plantilla
                  </button>
                </div>
              </div>
            </div>

            {/* Drop Zone */}
            <div className="p-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                  dragActive
                    ? 'border-uc-blue bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".xlsx,.xls"
                  onChange={handleFileInput}
                />
                
                <div className="text-6xl mb-4">📁</div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Arrastra tu archivo Excel aquí
                </h4>
                <p className="text-gray-600 mb-4">
                  o{' '}
                  <label htmlFor="file-upload" className="text-uc-blue hover:text-blue-800 cursor-pointer">
                    haz clic para seleccionar
                  </label>
                </p>
                <p className="text-sm text-gray-500">
                  Acepta archivos .xlsx y .xls (máximo 10MB)
                </p>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="mt-6">
                    <div className="bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-uc-blue h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">Procesando archivo... {uploadProgress}%</p>
                  </div>
                )}

                {/* Action Buttons */}
                {!isUploading && (
                  <div className="mt-4 flex justify-center space-x-4">
                    <label htmlFor="file-upload" className="px-6 py-2 bg-uc-yellow text-black rounded-lg hover:bg-yellow-500 transition-colors duration-200 cursor-pointer font-medium">
                      Cargar y Procesar
                    </label>
                    <label htmlFor="file-validate" className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 cursor-pointer">
                      Solo Validar
                    </label>
                    <input
                      type="file"
                      id="file-validate"
                      className="hidden"
                      accept=".xlsx,.xls"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          validateOnly(e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Upload Results */}
              {uploadResult && (
                <div className="mt-6 p-4 rounded-lg border">
                  <div className={`flex items-center mb-3 ${
                    uploadResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    <span className="mr-2 text-xl">
                      {uploadResult.success ? '✅' : '❌'}
                    </span>
                    <h4 className="font-semibold">{uploadResult.message}</h4>
                  </div>
                  
                  {uploadResult.summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-2xl font-bold text-uc-blue">
                          {uploadResult.summary.totalRecords}
                        </div>
                        <div className="text-sm text-gray-600">Total Registros</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded">
                        <div className="text-2xl font-bold text-green-600">
                          {uploadResult.summary.validRecords}
                        </div>
                        <div className="text-sm text-gray-600">Válidos</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded">
                        <div className="text-2xl font-bold text-red-600">
                          {uploadResult.summary.invalidRecords}
                        </div>
                        <div className="text-sm text-gray-600">Con Errores</div>
                      </div>
                    </div>
                  )}

                  {uploadResult.summary?.errors && uploadResult.summary.errors.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-semibold text-red-700 mb-2">Errores encontrados:</h5>
                      <div className="bg-red-50 p-3 rounded max-h-32 overflow-y-auto">
                        <ul className="text-sm text-red-700 space-y-1">
                          {uploadResult.summary.errors.map((error, index) => (
                            <li key={index}>
                              • {typeof error === 'string' 
                                ? error 
                                : `Fila ${error.row}: ${error.message} (Campo: ${error.field})`
                              }
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Requirements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Requisitos del Archivo</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Formato Excel (.xlsx o .xls)
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Tamaño máximo: 10MB
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Estructura según plantilla oficial
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Datos completos y válidos
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Sin filas vacías entre datos
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Consideraciones Importantes</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-yellow-500 mr-2 mt-0.5">•</span>
              <span>Los datos existentes serán reemplazados</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-500 mr-2 mt-0.5">•</span>
              <span>Realiza una copia de seguridad antes de cargar</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-500 mr-2 mt-0.5">•</span>
              <span>Valida los datos antes del procesamiento final</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-500 mr-2 mt-0.5">•</span>
              <span>El proceso puede tomar varios minutos</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Recent Uploads */}
      {recentUploads.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">📈 Cargas Recientes</h3>
          </div>
          <div className="p-6">
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
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registros
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentUploads.map((upload, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {upload.filename}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {upload.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(upload.date).toLocaleString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          getStatusBadge(upload.status)
                        }`}>
                          {upload.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <span>{upload.records}</span>
                          {upload.errors && upload.errors > 0 && (
                            <span className="text-red-500">({upload.errors} errores)</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataUploadPage;