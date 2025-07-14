import React, { useState } from 'react';
import { Bimestre } from '../../services/bimestre.service';
import EventModal, { CreateEventData } from '../events/EventModal';
import { eventService } from '../../services/event.service';

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
    subject?: string;
    teachers?: Array<{ id: number; name: string; rut: string; email: string }>;
    teacher_ids?: number[];
  };
}

interface CalendarViewProps {
  events?: CalendarEvent[];
  bimestreSeleccionado?: Bimestre | null;
  onEventCreate?: (eventData: CreateEventData) => void;
  onEventUpdate?: (id: string, eventData: CreateEventData) => void;
  onEventDelete?: (id: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  events = [], 
  bimestreSeleccionado,
  onEventCreate,
  onEventUpdate,
  onEventDelete
}) => {
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
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
  // Función para manejar el clic en un día del calendario
  const handleDayClick = (year: number, month: number, day: number) => {
    if (!isDayInBimestre(year, month, day)) return; // Solo permitir crear eventos en días del bimestre

    const clickedDate = new Date(year, month, day);
    setSelectedDate(clickedDate);
    setEditingEvent(null); // Asegurar que estamos creando un nuevo evento
    setIsEventModalOpen(true);
  };
  // Función para manejar la creación de eventos
  const handleEventCreate = async (eventData: CreateEventData) => {
    if (!onEventCreate) return;

    setIsCreatingEvent(true);
    try {
      await onEventCreate(eventData);
      setIsEventModalOpen(false); // Solo cerrar si no hay errores
    } catch (error) {
      console.error('Error creating event:', error);
      // NO cerrar el modal para que el usuario pueda ver el error y corregir
    } finally {
      setIsCreatingEvent(false);
    }
  };
  // Función para manejar la edición de eventos
  const handleEventEdit = async (event: CalendarEvent) => {
    try {
      // Obtener los datos completos del evento incluyendo los docentes
      const fullEvent = await eventService.getEventById(event.id);
      
      // Convertir el evento completo al formato CalendarEvent
      const fullCalendarEvent: CalendarEvent = {
        ...event,
        extendedProps: {
          ...event.extendedProps,
          teachers: fullEvent.extendedProps?.teachers,
          teacher_ids: fullEvent.extendedProps?.teacher_ids
        }
      };
      
      setEditingEvent(fullCalendarEvent);
      setSelectedDate(undefined); // No necesitamos selectedDate para editar
      setIsEventModalOpen(true);
    } catch (error) {
      console.error('Error loading event details:', error);
      // En caso de error, usar los datos básicos del evento
      setEditingEvent(event);
      setSelectedDate(undefined);
      setIsEventModalOpen(true);
    }
  };

  // Función para manejar la actualización de eventos
  const handleEventUpdate = async (eventData: CreateEventData) => {
    if (!onEventUpdate || !editingEvent) return;

    setIsCreatingEvent(true);
    try {
      await onEventUpdate(editingEvent.id, eventData);
      setIsEventModalOpen(false); // Solo cerrar si no hay errores
      setEditingEvent(null);
    } catch (error) {
      console.error('Error updating event:', error);
      // NO cerrar el modal para que el usuario pueda ver el error y corregir
    } finally {
      setIsCreatingEvent(false);
    }
  };

  // Función para manejar la eliminación de eventos
  const handleEventDelete = async (eventId: string) => {
    if (!onEventDelete) return;
    
    if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      try {
        await onEventDelete(eventId);
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  // Función para cerrar el modal y limpiar el estado
  const handleModalClose = () => {
    setIsEventModalOpen(false);
    setEditingEvent(null);
  };

  return (
    <div className="bg-white rounded-lg shadow">      {/* Header del calendario */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {bimestreSeleccionado 
            ? `${bimestreSeleccionado.nombre} (${formatDate(bimestreSeleccionado.fechaInicio)} - ${formatDate(bimestreSeleccionado.fechaFin)})`
            : `${monthNames[today.getMonth()]} ${today.getFullYear()}`
          }
        </h2>
        
        {/* Botón para crear evento */}
        <button
          onClick={() => {
            setSelectedDate(new Date());
            setEditingEvent(null);
            setIsEventModalOpen(true);
          }}
          className="bg-uc-yellow text-black px-4 py-2 rounded-md hover:bg-yellow-500 transition-colors flex items-center text-sm font-medium"
        >
          <span className="mr-2">➕</span>
          Nuevo Evento
        </button>
      </div>{/* Vista del calendario */}
      <div className="p-4">
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
                    const isInBimestre = isDayInBimestre(monthInfo.year, monthInfo.month, day);                    return (
                      <div
                        key={index}
                        className={`min-h-[100px] p-1 border border-gray-200 relative group ${
                          isInBimestre ? 'bg-white hover:bg-gray-50 cursor-pointer' : 'bg-gray-100'
                        } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
                        onClick={() => isInBimestre && handleDayClick(monthInfo.year, monthInfo.month, day)}
                      >
                        <div className={`text-sm font-medium mb-1 ${
                          isToday ? 'text-blue-600' : 
                          isInBimestre ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {day}
                        </div>
                        
                        {/* Botón para crear evento - solo visible en hover */}
                        {isInBimestre && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDayClick(monthInfo.year, monthInfo.month, day);
                            }}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-uc-yellow text-black rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-yellow-500 transition-all font-bold"
                            title="Crear evento"
                          >
                            +
                          </button>
                        )}
                          <div className="space-y-1">
                          {dayEvents.slice(0, 2).map(event => (
                            <div
                              key={event.id}
                              className="text-xs p-1 rounded truncate relative group/event"
                              style={{ backgroundColor: event.backgroundColor || '#3B82F6', color: 'white' }}
                              title={`${event.title} - ${formatTime(event.start)}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate flex-1">{event.title}</span>
                                
                                {/* Botones de acción del evento - visibles en hover */}
                                <div className="opacity-0 group-hover/event:opacity-100 flex space-x-1 ml-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEventEdit(event);
                                    }}
                                    className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded px-1 text-xs"
                                    title="Editar evento"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEventDelete(event.id);
                                    }}
                                    className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded px-1 text-xs"
                                    title="Eliminar evento"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
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
        </div>
      </div>

      {/* Footer con resumen */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-600">
          Total de eventos: {events.length}
          {bimestreSeleccionado && (
            <span className="ml-4">              Bimestre: {bimestreSeleccionado.nombre} 
              ({Math.ceil((new Date(bimestreSeleccionado.fechaFin).getTime() - new Date(bimestreSeleccionado.fechaInicio).getTime()) / (1000 * 60 * 60 * 24))} días)
            </span>
          )}
        </div>
      </div>      {/* Modal para crear eventos */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={handleModalClose}
        selectedDate={selectedDate}
        onSave={editingEvent ? handleEventUpdate : handleEventCreate}
        isLoading={isCreatingEvent}
        editingEvent={editingEvent}
      />
    </div>
  );
};

export default CalendarView;
