import React from 'react';
import { Clock, BookOpen, Hash } from 'lucide-react';
import { UseEventHoursResult } from '../../hooks/useEventHours';

interface TotalHoursDisplayProps {
  hoursResult: UseEventHoursResult;
  className?: string;
}

export const TotalHoursDisplay: React.FC<TotalHoursDisplayProps> = ({
  hoursResult,
  className = ''
}) => {
  const { hoursData, loading, error } = hoursResult;

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="h-6 w-6 text-blue-600 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total de Horas</p>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Clock className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total de Horas</p>
            <p className="text-2xl font-bold text-red-600">Error</p>
            <p className="text-xs text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total de Horas</p>
            <p className="text-2xl font-bold text-gray-900">
              {hoursData.totalHours.toLocaleString()}
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
              <span className="flex items-center space-x-1">
                <BookOpen className="h-3 w-3" />
                <span>{hoursData.eventCount} eventos</span>
              </span>
              <span className="flex items-center space-x-1">
                <Hash className="h-3 w-3" />
                <span>{hoursData.codes.length} códigos</span>
              </span>
            </div>
          </div>
        </div>
        

      </div>
      
      {hoursData.totalHours === 0 && hoursData.eventCount > 0 && (
        <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-xs text-yellow-700">
            No se encontraron códigos de asignatura válidos en los títulos de eventos.
          </p>
        </div>
      )}
    </div>
  );
};

export default TotalHoursDisplay;