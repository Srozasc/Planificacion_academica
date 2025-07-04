import React from 'react';

interface EventStatusIndicatorProps {
  status: 'pending' | 'approved' | 'rejected' | 'in_review';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const EventStatusIndicator: React.FC<EventStatusIndicatorProps> = ({ 
  status, 
  size = 'md', 
  showLabel = true 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: '⏳',
          label: 'Pendiente'
        };
      case 'approved':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: '✅',
          label: 'Aprobado'
        };
      case 'rejected':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '❌',
          label: 'Rechazado'
        };
      case 'in_review':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: '👁️',
          label: 'En Revisión'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '❓',
          label: 'Desconocido'
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  const config = getStatusConfig();
  const sizeClasses = getSizeClasses();

  return (
    <span 
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${
        config.color
      } ${sizeClasses}`}
    >
      <span className="text-xs">{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};

export default EventStatusIndicator;