import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = 'error',
  isVisible,
  onClose,
  duration = 6000
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // Tiempo para la animación de salida
  };

  const getToastStyles = () => {
    const baseStyles = 'fixed top-4 right-4 max-w-md w-full bg-white rounded-lg shadow-lg border-l-4 p-4 z-50 transition-all duration-300 transform';
    
    const typeStyles = {
      error: 'border-red-500',
      success: 'border-green-500',
      warning: 'border-yellow-500',
      info: 'border-blue-500'
    };

    const animationStyles = isAnimating && isVisible
      ? 'translate-x-0 opacity-100'
      : 'translate-x-full opacity-0';

    return `${baseStyles} ${typeStyles[type]} ${animationStyles}`;
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'error':
        return 'Error';
      case 'success':
        return 'Éxito';
      case 'warning':
        return 'Advertencia';
      case 'info':
        return 'Información';
      default:
        return 'Error';
    }
  };

  if (!isVisible && !isAnimating) return null;

  return (
    <div className={getToastStyles()}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3 text-xl">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            {getTitle()}
          </h4>
          <div className="text-sm text-gray-700 whitespace-pre-line">
            {message}
          </div>
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <span className="text-lg">×</span>
        </button>
      </div>
    </div>
  );
};

export default Toast;