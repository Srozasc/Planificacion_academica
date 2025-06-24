import React from 'react';
import { Bimestre } from '../../services/bimestre.service';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  extendedProps?: {
    teacher?: string;
    room?: string;
    students?: number;
  };
}

interface CalendarViewProps {
  events?: CalendarEvent[];
  selectedView?: string;
  onViewChange?: (view: string) => void;
  bimestreSeleccionado?: Bimestre | null;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  events = [], 
  selectedView = 'month',
  onViewChange,
  bimestreSeleccionado
}) => {
  // Función helper para formatear fechas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Determinar el rango de fechas a mostrar
  let startDate: Date;
  let endDate: Date;
  
  if (bimestreSeleccionado) {
    startDate = new Date(bimestreSeleccionado.fechaInicio);
    endDate = new Date(bimestreSeleccionado.fechaFin);
  } else {
    // Fallback al mes actual si no hay bimestre seleccionado
    const today = new Date();
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  }

  // Generar los meses a mostrar basados en el rango del bimestre
  const getMonthsInRange = (start: Date, end: Date) => {
    const months = [];
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    
    while (current <= end) {
      months.push({
        year: current.getFullYear(),
        month: current.getMonth(),
        name: monthNames[current.getMonth()],
        daysInMonth: new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate(),
        firstDayOfWeek: new Date(current.getFullYear(), current.getMonth(), 1).getDay()
      });
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const monthsToShow = getMonthsInRange(startDate, endDate);

  // Filtrar eventos para un día específico
  const getEventsForDay = (year: number, month: number, day: number) => {
    const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(event => event.start.startsWith(dayString));
  };

  // Generar días para un mes específico
  const generateDaysForMonth = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const days = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  // Verificar si un día está dentro del rango del bimestre
  const isDayInBimestre = (year: number, month: number, day: number) => {
    if (!bimestreSeleccionado) return true;
    
    const currentDate = new Date(year, month, day);
    const bimestreStart = new Date(bimestreSeleccionado.fechaInicio);
    const bimestreEnd = new Date(bimestreSeleccionado.fechaFin);
    
    return currentDate >= bimestreStart && currentDate <= bimestreEnd;
  };

  const today = new Date();

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header del calendario */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {bimestreSeleccionado 
              ? `${bimestreSeleccionado.nombre} (${formatDate(bimestreSeleccionado.fechaInicio)} - ${formatDate(bimestreSeleccionado.fechaFin)})`
              : `${monthNames[today.getMonth()]} ${today.getFullYear()}`
            }
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => onViewChange?.('month')}
              className={`px-3 py-1 rounded text-sm ${
                selectedView === 'month' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => onViewChange?.('week')}
              className={`px-3 py-1 rounded text-sm ${
                selectedView === 'week' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Semana
            </button>
          </div>
        </div>
      </div>

      {/* Vista del calendario */}
      <div className="p-4">
        {selectedView === 'month' ? (
          <div className="space-y-8">
            {monthsToShow.map((monthInfo, monthIndex) => {
              const days = generateDaysForMonth(monthInfo.year, monthInfo.month);
              
              return (
                <div key={`${monthInfo.year}-${monthInfo.month}`}>
                  {/* Título del mes */}
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {monthInfo.name} {monthInfo.year}
                  </h3>
                  
                  {/* Nombres de los días */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map(dayName => (
                      <div key={dayName} className="p-2 text-center text-sm font-medium text-gray-500">
                        {dayName}
                      </div>
                    ))}
                  </div>

                  {/* Días del mes */}
                  <div className="grid grid-cols-7 gap-1 mb-6">
                    {days.map((day, index) => {
                      if (!day) {
                        return (
                          <div
                            key={index}
                            className="min-h-[100px] p-1 bg-gray-50"
                          />
                        );
                      }

                      const dayEvents = getEventsForDay(monthInfo.year, monthInfo.month, day);
                      const isToday = day === today.getDate() && 
                                    monthInfo.month === today.getMonth() && 
                                    monthInfo.year === today.getFullYear();
                      const isInBimestre = isDayInBimestre(monthInfo.year, monthInfo.month, day);

                      return (
                        <div
                          key={index}
                          className={`min-h-[100px] p-1 border border-gray-200 ${
                            isInBimestre ? 'bg-white hover:bg-gray-50' : 'bg-gray-100'
                          } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
                        >
                          <div className={`text-sm font-medium mb-1 ${
                            isToday ? 'text-blue-600' : 
                            isInBimestre ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {day}
                          </div>
                          <div className="space-y-1">
                            {dayEvents.slice(0, 2).map(event => (
                              <div
                                key={event.id}
                                className="text-xs p-1 rounded truncate"
                                style={{ backgroundColor: event.backgroundColor || '#3B82F6', color: 'white' }}
                                title={`${event.title} - ${formatTime(event.start)}`}
                              >
                                {event.title}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-xs text-gray-500 text-center">
                                +{dayEvents.length - 2} más
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>        ) : (
          // Vista de semana (simplificada)
          <div className="space-y-4">
            <div className="text-center text-gray-500">
              Vista de semana - Próximamente
            </div>
            <div className="space-y-2">
              {events.slice(0, 5).map(event => (
                <div
                  key={event.id}
                  className="flex items-center p-3 border border-gray-200 rounded-lg"
                >
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: event.backgroundColor || '#3B82F6' }}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-gray-500">
                      {formatDate(event.start)} - {formatTime(event.start)} a {formatTime(event.end)}
                    </div>
                    {event.extendedProps?.teacher && (
                      <div className="text-sm text-gray-600">
                        {event.extendedProps.teacher} • {event.extendedProps.room}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer con resumen */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-600">
          Total de eventos: {events.length}
          {bimestreSeleccionado && (
            <span className="ml-4">
              Bimestre: {bimestreSeleccionado.nombre} 
              ({Math.ceil((new Date(bimestreSeleccionado.fechaFin).getTime() - new Date(bimestreSeleccionado.fechaInicio).getTime()) / (1000 * 60 * 60 * 24))} días)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
