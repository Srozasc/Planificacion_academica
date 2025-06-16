import React, { useState } from 'react';

const DataUploadPage: React.FC = () => {
  const [selectedFileType, setSelectedFileType] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const fileTypes = [
    {
      id: 'academic-structure',
      name: 'Estructura Académica',
      description: 'Información de programas, asignaturas y planes de estudio',
      icon: '🏛️',
      format: '.xlsx',
      templateName: 'estructura_academica_template.xlsx'
    },
    {
      id: 'course-reports',
      name: 'Reporte de Cursables',
      description: 'Asignaturas disponibles para programar en el período',
      icon: '📚',
      format: '.xlsx',
      templateName: 'reporte_cursables_template.xlsx'
    },
    {
      id: 'teachers',
      name: 'Nómina de Docentes',
      description: 'Información de profesores y sus categorías',
      icon: '👨‍🏫',
      format: '.xlsx',
      templateName: 'nomina_docentes_template.xlsx'
    },
    {
      id: 'payment-codes',
      name: 'Siglas de Pago',
      description: 'Códigos y factores de pago para docentes',
      icon: '💰',
      format: '.xlsx',
      templateName: 'siglas_pago_template.xlsx'
    }
  ];

  const recentUploads = [
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

  const handleFile = (file: File) => {
    if (!selectedFileType) {
      alert('Por favor selecciona el tipo de archivo primero');
      return;
    }

    // Simular carga de archivo
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          alert(`Archivo ${file.name} cargado exitosamente`);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
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
                  ? 'border-blue-500 bg-blue-50'
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
                <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                  <span className="mr-2">📥</span>
                  Descargar Plantilla
                </button>
              </div>
            </div>

            {/* Drop Zone */}
            <div className="p-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
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
                  <label htmlFor="file-upload" className="text-blue-600 hover:text-blue-800 cursor-pointer">
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
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">Cargando archivo... {uploadProgress}%</p>
                  </div>
                )}
              </div>
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
              Usar plantilla oficial
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              No modificar nombres de columnas
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Datos en la primera hoja
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Validaciones Automáticas</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <span className="text-blue-500 mr-2">•</span>
              Formato de campos obligatorios
            </li>
            <li className="flex items-center">
              <span className="text-blue-500 mr-2">•</span>
              Duplicados y consistencia
            </li>
            <li className="flex items-center">
              <span className="text-blue-500 mr-2">•</span>
              Integridad referencial
            </li>
            <li className="flex items-center">
              <span className="text-blue-500 mr-2">•</span>
              Rangos de valores válidos
            </li>
            <li className="flex items-center">
              <span className="text-blue-500 mr-2">•</span>
              Códigos institucionales
            </li>
          </ul>
        </div>
      </div>

      {/* Recent Uploads */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Cargas Recientes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentUploads.map((upload, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{upload.filename}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {upload.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(upload.date).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(upload.status)}`}>
                      {upload.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {upload.records} registros
                    {upload.errors && (
                      <span className="text-red-600 ml-2">({upload.errors} errores)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <button className="text-blue-600 hover:text-blue-900">📄 Ver</button>
                      <button className="text-green-600 hover:text-green-900">📥 Descargar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataUploadPage;
