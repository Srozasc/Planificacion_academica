import React, { useState, useRef } from 'react';
import { XMarkIcon, DocumentArrowUpIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import usersService from '../../../services/users.service';
import { useBimestreStore } from '../../../store/bimestre.store';

interface UserImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUsersImported: () => void;
}

interface ImportResult {
  success: boolean;
  message: string;
  details?: {
    processed: number;
    created: number;
    updated: number;
    errors: number;
    errorDetails?: string[];
  };
}

const UserImportModal: React.FC<UserImportModalProps> = ({ isOpen, onClose, onUsersImported }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { bimestreSeleccionado } = useBimestreStore();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      alert('Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV (.csv)');
      return;
    }
    
    setFile(selectedFile);
    setImportResult(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    if (!bimestreSeleccionado) {
      setImportResult({
        success: false,
        message: 'Debe seleccionar un bimestre en el navbar antes de importar usuarios'
      });
      return;
    }
    
    setIsUploading(true);
    setImportResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bimestreId', bimestreSeleccionado.id.toString());
      
      const result = await usersService.importUsers(formData);
      setImportResult(result);
      
      if (result.success) {
        onUsersImported();
      }
    } catch (error: any) {
      setImportResult({
        success: false,
        message: error.message || 'Error al importar usuarios'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
    setIsUploading(false);
    onClose();
  };

  const downloadTemplate = () => {
    // Crear un enlace para descargar la plantilla
    const link = document.createElement('a');
    link.href = '/templates/plantilla_usuarios.xlsx';
    link.download = 'plantilla_usuarios.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Importar Usuarios</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {!importResult && (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Sube un archivo Excel (.xlsx, .xls) o CSV (.csv) con la información de los usuarios.
              </p>
              <button
                onClick={downloadTemplate}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Descargar plantilla de ejemplo
              </button>
            </div>

            {/* Zona de arrastrar y soltar */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center ${
                dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    {file ? file.name : 'Arrastra un archivo aquí o haz clic para seleccionar'}
                  </span>
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileInputChange}
                  />
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  Excel (.xlsx, .xls) o CSV hasta 10MB
                </p>
              </div>
            </div>

            {file && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <DocumentArrowUpIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">{file.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            )}

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 mr-2" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Formato esperado:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Columnas requeridas:</strong> Usuario, Mail, Nombre, Tipo de Rol</li>
                    <li><strong>Columnas opcionales:</strong> Cargo, Carrera, Categoria, Expiracion</li>
                    <li>El Mail debe ser único y válido</li>
                    <li>El Tipo de Rol debe existir en el sistema (Editor, Administrador, Visualizador)</li>
                    <li>Carrera: código de carrera para permisos específicos</li>
                    <li>Categoria: TRAN para transversales u otras categorías especiales</li>
                    <li>Expiracion: fecha en formato DD-MM-YYYY (ejemplo: 31-12-2024)</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Resultado de la importación */}
        {importResult && (
          <div className={`p-4 rounded-md ${
            importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              {importResult.success ? (
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              )}
              <div className="flex-1">
                <h4 className={`text-sm font-medium ${
                  importResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {importResult.success ? 'Importación exitosa' : 'Error en la importación'}
                </h4>
                <p className={`text-sm mt-1 ${
                  importResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {importResult.message}
                </p>
                
                {importResult.details && (
                  <div className="mt-2 text-sm">
                    <p className={importResult.success ? 'text-green-700' : 'text-red-700'}>
                      Procesados: {importResult.details.processed} | 
                      Creados: {importResult.details.created} | 
                      Actualizados: {importResult.details.updated} | 
                      Errores: {importResult.details.errors}
                    </p>
                    
                    {importResult.details.errorDetails && importResult.details.errorDetails.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium text-red-800">Detalles de errores:</p>
                        <ul className="list-disc list-inside mt-1 text-red-700">
                          {importResult.details.errorDetails.slice(0, 5).map((error, index) => (
                            <li key={`error-${index}-${error.substring(0, 20)}`} className="text-xs">{error}</li>
                          ))}
                          {importResult.details.errorDetails.length > 5 && (
                            <li className="text-xs">... y {importResult.details.errorDetails.length - 5} errores más</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {importResult ? 'Cerrar' : 'Cancelar'}
          </button>
          {!importResult && (
            <button
              onClick={handleImport}
              disabled={!file || isUploading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Importando...' : 'Importar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserImportModal;