import React, { useState, useEffect } from 'react';
import { uploadService, SystemStats } from './services/upload.service';
import { useBimestreStore } from '../../store/bimestre.store';
import DataViewModal from './components/DataViewModal';
import RecentUploadsManager from './components/RecentUploadsManager';
import UploadHistoryManager from './components/UploadHistoryManager';

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
  id: string;
  filename: string;
  type: string;
  date: string;
  bimestre: string;
  status: 'Exitoso' | 'Con errores' | 'Error';
  records: number;
  errors?: number;
}

const DataUploadPage: React.FC = () => {
  const [selectedFileType, setSelectedFileType] = useState('');
  const [selectedBimestreId, setSelectedBimestreId] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [isDataViewModalOpen, setIsDataViewModalOpen] = useState(false);
  const [selectedUploadId, setSelectedUploadId] = useState<string>('');
  const [currentView, setCurrentView] = useState<'upload' | 'recent' | 'history'>('upload');
  
  const { bimestres, bimestreSeleccionado, fetchBimestresActivos } = useBimestreStore();

  const fileTypes: FileType[] = [
    {
      id: 'academic-structures',
      name: 'Estructura Académica',
      description: 'Información de programas, asignaturas y planes de estudio',
      icon: '🏛️',
      format: '.xlsx',
      templateName: 'estructura_academica_template.xlsx',
      endpoint: 'estructura-academica'
    },
    {
      id: 'reporte-cursables',
      name: 'Reporte de Cursables',
      description: 'Asignaturas disponibles para programar en el período',
      icon: '📚',
      format: '.xlsx',
      templateName: 'reporte_cursables_template.xlsx',
      endpoint: 'reporte-cursables'
    },
    {
      id: 'nomina-docentes',
      name: 'Nómina de Docentes',
      description: 'Información de profesores con DOCENTE, ID DOCENTE y RUT DOCENTE',
      icon: '👨‍🏫',
      format: '.xlsx',
      templateName: 'nomina_docentes_template.xlsx',
      endpoint: 'nomina-docentes'
    },
    {
      id: 'adol',
      name: 'ADOL - Cargos Docentes',
      description: 'Cargos que se pueden asignar a docentes y sus siglas identificadoras',
      icon: '👔',
      format: '.xlsx',
      templateName: 'adol_template.xlsx',
      endpoint: 'adol'
    },
    {
      id: 'dol',
      name: 'DOL - Cargos Docentes',
      description: 'Cargos que se pueden asignar a docentes y sus siglas identificadoras',
      icon: '📋',
      format: '.xlsx',
      templateName: 'dol_template.xlsx',
      endpoint: 'dol'
    },
    {
      id: 'vacantes-inicio',
      name: 'Vacantes Inicio',
      description: 'En construcción - Módulo para cargar información de vacantes de inicio',
      icon: '🏁',
      format: '.xlsx',
      templateName: 'vacantes_inicio_template.xlsx',
      endpoint: 'vacantes-inicio'
    },
    {
      id: 'ramos-optativos',
      name: 'Asignaturas Optativas',
      description: 'Información de asignaturas optativas disponibles para el período académico',
      icon: '🎯',
      format: '.xlsx',
      templateName: 'ramos_optativos_template.xlsx',
      endpoint: 'asignaturas-optativas'
    }
  ];

  // Load initial data
  useEffect(() => {
    loadSystemStats();
    fetchBimestresActivos();
  }, [fetchBimestresActivos]);

  // Mantener selección de bimestre para todos los tipos de archivo
  // useEffect(() => {
  //   // Ya no es necesario limpiar la selección ya que todos requieren bimestre
  // }, [selectedFileType]);

  // Inicializar con el bimestre seleccionado en el navbar
  useEffect(() => {
    if (bimestreSeleccionado && !selectedBimestreId) {
      setSelectedBimestreId(bimestreSeleccionado.id);
    }
  }, [bimestreSeleccionado, selectedBimestreId]);

  const loadSystemStats = async () => {
    try {
      const stats = await uploadService.getSystemStats();
      setSystemStats(stats);
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
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

    // Validar bimestre (requerido para todos los tipos de archivo)
    if (!selectedBimestreId) {
      alert(`Por favor selecciona un bimestre para cargar datos de ${fileType.name}`);
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
      const uploadOptions = selectedBimestreId 
        ? { bimestreId: selectedBimestreId }
        : {};
      const result = await uploadService.uploadFile(fileType.endpoint, file, uploadOptions);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Wait a bit to show 100% progress
      setTimeout(() => {
        setIsUploading(false);
        setUploadResult(result);
        
        // Add to recent uploads
        const selectedBimestre = bimestres.find(b => b.id === selectedBimestreId);
        const newUpload: RecentUpload = {
          id: Date.now().toString(),
          filename: file.name,
          type: fileType.name,
          date: new Date().toISOString(),
          bimestre: selectedBimestre ? `${selectedBimestre.nombre} (${selectedBimestre.fechaInicio} - ${selectedBimestre.fechaFin})` : 'No especificado',
          status: result.success ? 'Exitoso' : 'Con errores',
          records: result.summary?.totalRecords || 0,
          errors: result.summary?.invalidRecords || 0
        };
        
        setRecentUploads(prev => [newUpload, ...prev]);
        
        // Reload stats after successful upload
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

  // Función para visualizar datos cargados
  const handleViewData = (upload: RecentUpload) => {
    setSelectedUploadId(upload.id);
    setIsDataViewModalOpen(true);
  };

  // Función para cerrar el modal de visualización
  const handleCloseDataViewModal = () => {
    setIsDataViewModalOpen(false);
    setSelectedUploadId('');
  };

  // Función para aprobar datos (stub)
  const handleApproveData = (upload: RecentUpload) => {
    console.log('Aprobar datos para:', upload.filename);
    // TODO: Implementar lógica de aprobación
    alert(`Funcionalidad de aprobación para ${upload.filename} será implementada próximamente`);
  };

  const handleRefresh = () => {
    loadSystemStats();
  };

  return (
    <div className="data-upload-page p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📁 Carga de Datos</h1>
        <p className="text-gray-600">
          Carga y gestiona archivos Excel para alimentar el sistema de planificación académica
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setCurrentView('upload')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              currentView === 'upload'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Cargar Archivos
          </button>
          <button
            onClick={() => setCurrentView('recent')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              currentView === 'recent'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Cargas Recientes
          </button>
          <button
            onClick={() => setCurrentView('history')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              currentView === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Historial Completo
          </button>
        </nav>
      </div>

      {/* Conditional Content Based on Current View */}
      {currentView === 'upload' && (
        <>
          {/* System Stats */}
          <div className="mb-8">
        {systemStats && (
          <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center">
              <span className="mr-1">🏛️</span>
              <span>Estructuras académicas: {systemStats.academic_structures}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-1">👨‍🏫</span>
              <span>Docentes: {systemStats.teachers}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-1">📚</span>
              <span>Reportes de curso: {systemStats.course_reports}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-1">👔</span>
              <span>ADOL: {systemStats.staging_adol_simple}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-1">📋</span>
              <span>DOL: {systemStats.staging_dol}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-1">🏁</span>
              <span>Vacantes Inicio: {systemStats.staging_vacantes_inicio}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-1">🎯</span>
              <span>Asignaturas Optativas: {systemStats.ramos_optativos || 0}</span>
            </div>
          </div>
        )}
      </div>

      {/* File Type Selection */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Seleccionar Tipo de Archivo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Cargar {fileTypes.find(t => t.id === selectedFileType)?.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Arrastra tu archivo aquí
                  </p>
                </div>
              
              {/* Selector de Bimestre (Requerido para todos los tipos de archivo) */}
              {selectedFileType && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="mr-2">📅</span>
                    Seleccionar Bimestre (Requerido)
                  </label>
                  <select
                    value={selectedBimestreId || ''}
                    onChange={(e) => setSelectedBimestreId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-uc-blue focus:border-uc-blue"
                    required
                  >
                    <option value="">Selecciona un bimestre...</option>
                    {bimestres.map((bimestre) => {
                      // Función para parsear fechas sin problemas de zona horaria
                      const parseLocalDate = (dateString: string): Date => {
                        const date = new Date(dateString + 'T00:00:00');
                        return date;
                      };
                      
                      return (
                        <option key={bimestre.id} value={bimestre.id}>
                          {bimestre.nombre} ({parseLocalDate(bimestre.fechaInicio).toLocaleDateString('es-ES')} - {parseLocalDate(bimestre.fechaFin).toLocaleDateString('es-ES')})
                        </option>
                      );
                    })}
                  </select>
                  {!selectedBimestreId && (
                    <p className="mt-2 text-sm text-amber-600">
                      ⚠️ Debes seleccionar un bimestre antes de cargar el archivo {selectedFileType?.toUpperCase()}
                    </p>
                  )}
                </div>
              )}
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
                  <div className="mt-4 flex justify-center">
                    <label htmlFor="file-upload" className="px-6 py-2 bg-uc-yellow text-black rounded-lg hover:bg-yellow-500 transition-colors duration-200 cursor-pointer font-medium">
                      Cargar y Procesar
                    </label>
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
                            <li key={`error-${index}-${typeof error === 'string' ? error.slice(0, 20) : error.row}`}>
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

        </>
      )}

      {/* Recent Uploads View */}
      {currentView === 'recent' && (
        <RecentUploadsManager onRefresh={handleRefresh} />
      )}

      {/* Upload History View */}
      {currentView === 'history' && (
        <UploadHistoryManager onRefresh={handleRefresh} />
      )}
      
      {/* Modal de visualización de datos */}
      <DataViewModal
        isOpen={isDataViewModalOpen}
        onClose={handleCloseDataViewModal}
        uploadId={selectedUploadId}
      />
    </div>
  );
};

export default DataUploadPage;