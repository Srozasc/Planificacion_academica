import React, { useEffect } from 'react';
import { useBimestreStore } from '../../store/bimestre.store';
import { bimestreService, Bimestre } from '../../services/bimestre.service';
import { CalendarIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface BimestreSelectorProps {
  onBimestreChange?: (bimestreId: number | null) => void;
  className?: string;
}

const BimestreSelector: React.FC<BimestreSelectorProps> = ({ 
  onBimestreChange, 
  className = '' 
}) => {
  const {
    bimestres,
    bimestreSeleccionado,
    bimestreActual,
    isLoading,
    fetchBimestresActivos,
    fetchBimestreActual,
    seleccionarBimestre
  } = useBimestreStore();

  useEffect(() => {
    console.log('BimestreSelector - Cargando bimestres...');
    fetchBimestresActivos();
    fetchBimestreActual();
  }, [fetchBimestresActivos, fetchBimestreActual]);

  useEffect(() => {
    console.log('BimestreSelector - bimestreSeleccionado cambió:', bimestreSeleccionado);
    console.log('BimestreSelector - bimestreActual:', bimestreActual);
  }, [bimestreSeleccionado, bimestreActual]);  const handleBimestreChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const bimestreId = event.target.value ? parseInt(event.target.value) : null;
    
    if (!bimestreId || !bimestres) {
      seleccionarBimestre(null);
      onBimestreChange?.(null);
      return;
    }
    
    const bimestre = bimestres.find(b => b && b.id === bimestreId) || null;
    
    seleccionarBimestre(bimestre);
    onBimestreChange?.(bimestre?.id || null);
  };
  // Función para parsear fechas sin conversión de zona horaria
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
    return new Date(year, month - 1, day); // month-1 porque Date usa índices 0-11
  };

  const formatBimestreOption = (bimestre: Bimestre) => {
    const fechaInicio = parseLocalDate(bimestre.fechaInicio).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    });
    const fechaFin = parseLocalDate(bimestre.fechaFin).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    });
    
    return `${bimestre.nombre} (${fechaInicio} - ${fechaFin})`;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <CalendarIcon className="h-5 w-5 text-gray-400" />
        <div className="animate-pulse bg-gray-200 h-10 w-64 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <CalendarIcon className="h-5 w-5 text-blue-600" />
      <div className="relative">
        <select
          value={bimestreSeleccionado?.id || ''}
          onChange={handleBimestreChange}
          className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[280px]"
        >          <option value="">Seleccionar bimestre</option>
          {(bimestres || [])
            .filter(bimestre => bimestre && bimestre.id && bimestre.nombre)
            .map((bimestre) => (
              <option key={bimestre.id} value={bimestre.id}>
                {formatBimestreOption(bimestre)}
                {bimestreActual?.id === bimestre.id ? ' (Actual)' : ''}
              </option>
            ))}
        </select>
        <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
        {bimestreSeleccionado && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">
            {bimestreService.getDuracionDias(bimestreSeleccionado.fechaInicio, bimestreSeleccionado.fechaFin)} días
          </span>
        </div>
      )}
    </div>
  );
};

export default BimestreSelector;
