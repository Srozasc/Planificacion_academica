import { useState, useEffect, useMemo } from 'react';
import { getEventsTotalHours, EventHoursData } from '../services/hoursService';

export interface UseEventHoursResult {
  hoursData: EventHoursData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook personalizado para calcular las horas totales de una lista de eventos
 */
export function useEventHours(events: any[]): UseEventHoursResult {
  const [hoursData, setHoursData] = useState<EventHoursData>({
    totalHours: 0,
    eventCount: 0,
    details: [],
    codes: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debug: Log eventos recibidos
  console.log('🔍 useEventHours - Eventos recibidos:', {
    cantidad: events.length,
    eventos: events.map(e => ({ title: e.title, type: typeof e.title }))
  });

  // Memoizar los eventos para evitar recálculos innecesarios
  const memoizedEvents = useMemo(() => events, [JSON.stringify(events)]);

  const fetchHours = async () => {
    console.log('🔍 fetchHours - Iniciando con eventos:', memoizedEvents.length);
    
    if (!memoizedEvents || memoizedEvents.length === 0) {
      console.log('🔍 fetchHours - Sin eventos, reseteando datos');
      setHoursData({
        totalHours: 0,
        eventCount: 0,
        details: [],
        codes: []
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 fetchHours - Llamando a getEventsTotalHours');
      const data = await getEventsTotalHours(memoizedEvents);
      console.log('🔍 fetchHours - Resultado obtenido:', data);
      setHoursData(data);
    } catch (err) {
      console.error('🔍 fetchHours - Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al calcular horas';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHours();
  }, [memoizedEvents]);

  return {
    hoursData,
    loading,
    error,
    refetch: fetchHours
  };
}

/**
 * Hook simplificado que solo retorna las horas totales
 */
export function useEventTotalHours(events: any[]): {
  totalHours: number;
  loading: boolean;
  error: string | null;
} {
  const { hoursData, loading, error } = useEventHours(events);
  
  return {
    totalHours: hoursData.totalHours,
    loading,
    error
  };
}