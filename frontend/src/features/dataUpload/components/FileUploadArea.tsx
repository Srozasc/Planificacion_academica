import React, { useState } from 'react';

interface FileUploadAreaProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  onFileSelect,
  accept = '.xlsx,.xls',
  maxSize = 10 * 1024 * 1024, // 10MB default
  disabled = false,
  className = ''
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    
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
    
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileValidation(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    if (e.target.files && e.target.files[0]) {
      handleFileValidation(e.target.files[0]);
    }
  };

  const handleFileValidation = (file: File) => {
    // Validate file type
    if (accept && !file.name.match(new RegExp(`\\.(${accept.replace(/\./g, '').replace(/,/g, '|')})$`, 'i'))) {
      alert(`Solo se permiten archivos: ${accept}`);
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      const maxMB = (maxSize / 1024 / 1024).toFixed(1);
      alert(`El archivo es demasiado grande. Máximo ${maxMB}MB permitido.`);
      return;
    }

    onFileSelect(file);
  };

  return (
    <div className={`file-upload-area ${className}`}>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
          disabled 
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 cursor-pointer'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('file-upload-input')?.click()}
      >
        <input
          type="file"
          id="file-upload-input"
          className="hidden"
          accept={accept}
          onChange={handleFileInput}
          disabled={disabled}
        />
        
        <div className={`text-6xl mb-4 ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
          📁
        </div>
        <h4 className={`text-lg font-medium mb-2 ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
          {disabled ? 'Subida deshabilitada' : 'Arrastra tu archivo Excel aquí'}
        </h4>
        {!disabled && (
          <>
            <p className="text-gray-600 mb-4">
              o{' '}
              <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                haz clic para seleccionar
              </span>
            </p>
            <p className="text-sm text-gray-500">
              Acepta archivos {accept} (máximo {(maxSize / 1024 / 1024).toFixed(1)}MB)
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUploadArea;
