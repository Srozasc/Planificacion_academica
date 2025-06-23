import { useState, useEffect, useMemo } from 'react';
import { useBimestreStore } from '../store/bimestre.store';
import { bimestreService } from '../services/bimestre.service';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isInBimestre: boolean;
  isBimestreStart: boolean;
  isBimestreEnd: boolean;
  events?: any[];
}

export const useCalendarWithBimestres = (currentDate: Date = new Date()) => {
  const { bimestreSeleccionado, getFechasBimestre } = useBimestreStore();
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

  // Obtener fechas del bimestre seleccionado
  const fechasBimestre = useMemo(() => {
    if (!bimestreSeleccionado) return [];
    return getFechasBimestre(bimestreSeleccionado);
  }, [bimestreSeleccionado, getFechasBimestre]);

  // Generar días del calendario
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Primer día del mes
    const firstDayOfMonth = new Date(year, month, 1);
    // Último día del mes
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Primer día de la semana que contiene el primer día del mes
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // Último día de la semana que contiene el último día del mes
    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Generar todos los días del calendario
    const currentDay = new Date(startDate);
    while (currentDay <= endDate) {
      const dayDate = new Date(currentDay);
      dayDate.setHours(0, 0, 0, 0);
      
      // Verificar si está en el bimestre seleccionado
      const isInBimestre = bimestreSeleccionado ? 
        bimestreService.contieneFecha(bimestreSeleccionado, dayDate) : false;
      
      // Verificar si es inicio o fin del bimestre
      const isBimestreStart = bimestreSeleccionado ?
        dayDate.getTime() === new Date(bimestreSeleccionado.fechaInicio).getTime() : false;
      
      const isBimestreEnd = bimestreSeleccionado ?
        dayDate.getTime() === new Date(bimestreSeleccionado.fechaFin).getTime() : false;
      
      days.push({
        date: new Date(dayDate),
        isCurrentMonth: dayDate.getMonth() === month,
        isToday: dayDate.getTime() === today.getTime(),
        isInBimestre,
        isBimestreStart,
        isBimestreEnd,
        events: [] // Aquí se pueden agregar eventos del día
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    setCalendarDays(days);
  }, [currentDate, bimestreSeleccionado, fechasBimestre]);

  // Métodos útiles
  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  const getDayNames = () => {
    return ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  };

  const goToNextMonth = () => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  };

  const goToPreviousMonth = () => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  };

  const goToToday = () => {
    return new Date();
  };

  // Información del bimestre actual
  const bimestreInfo = useMemo(() => {
    if (!bimestreSeleccionado) return null;
    
    return {
      nombre: bimestreSeleccionado.nombre,
      fechaInicio: bimestreService.formatFecha(bimestreSeleccionado.fechaInicio),
      fechaFin: bimestreService.formatFecha(bimestreSeleccionado.fechaFin),
      duracionDias: bimestreService.getDuracionDias(
        bimestreSeleccionado.fechaInicio, 
        bimestreSeleccionado.fechaFin
      ),
      anoAcademico: bimestreSeleccionado.anoAcademico,
      numeroBimestre: bimestreSeleccionado.numeroBimestre
    };
  }, [bimestreSeleccionado]);

  return {
    calendarDays,
    bimestreSeleccionado,
    bimestreInfo,
    fechasBimestre,
    getMonthName,
    getDayNames,
    goToNextMonth,
    goToPreviousMonth,
    goToToday
  };
};
