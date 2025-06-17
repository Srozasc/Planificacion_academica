import React from 'react';

interface UploadProgressProps {
  progress: number;
  isUploading: boolean;
  fileName?: string;
  message?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'red' | 'yellow';
}

const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  isUploading,
  fileName,
  message,
  showPercentage = true,
  size = 'md',
  color = 'blue'
}) => {
  if (!isUploading && progress === 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600'
  };

  const getStatusIcon = () => {
    if (progress === 100 && !isUploading) {
      return color === 'red' ? '❌' : '✅';
    }
    if (isUploading) {
      return '⏳';
    }
    return '📤';
  };

  const getStatusMessage = () => {
    if (message) return message;
    
    if (progress === 100 && !isUploading) {
      return color === 'red' ? 'Error en la carga' : 'Carga completada';
    }
    if (isUploading) {
      return 'Procesando archivo...';
    }
    return 'Preparando carga...';
  };

  return (
    <div className="upload-progress mt-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <span className="mr-2 text-lg">{getStatusIcon()}</span>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {fileName || 'Archivo seleccionado'}
            </p>
            <p className="text-xs text-gray-600">
              {getStatusMessage()}
            </p>
          </div>
        </div>
        {showPercentage && (
          <span className="text-sm font-medium text-gray-700">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      
      <div className="bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      
      {isUploading && (
        <div className="mt-2 flex items-center text-xs text-gray-500">
          <div className="animate-spin mr-1">⏳</div>
          <span>No cierres esta ventana hasta que termine la carga</span>
        </div>
      )}
    </div>
  );
};

export default UploadProgress;
