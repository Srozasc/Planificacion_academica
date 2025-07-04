import React, { useState, useEffect } from 'react';
import CalendarView from '../components/dashboard/CalendarView';
import BimestreSelector from '../components/bimestres/BimestreSelector';
import BimestreConfigurador from '../components/bimestres/BimestreConfigurador';
import { CogIcon } from '@heroicons/react/24/outline';
import { useBimestreStore } from '../store/bimestre.store';
import { eventService, Event } from '../services/event.service';
import { CreateEventData } from '../components/events/EventModal';

const DashboardPage: React.FC = () => {
  const [isConfiguradorOpen, setIsConfiguradorOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const { bimestreSeleccionado } = useBimestreStore();

  // Función para cargar eventos
  const loadEvents = async () => {
    setIsLoadingEvents(true);
    try {
      let startDate, endDate;
      
      if (bimestreSeleccionado) {
        startDate = bimestreSeleccionado.fechaInicio;
        endDate = bimestreSeleccionado.fechaFin;
      }
      
      const fetchedEvents = await eventService.getEvents(startDate, endDate);
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      // En caso de error, usar eventos de ejemplo
      setEvents(mockEvents);
    } finally {
      setIsLoadingEvents(false);
    }
  };
  // Función para crear evento
  const handleEventCreate = async (eventData: CreateEventData) => {
    try {
      const newEvent = await eventService.createEvent(eventData);
      setEvents(prev => [...prev, newEvent]);
    } catch (error) {
      console.error('Error creating event:', error);
      // En caso de error del backend, crear evento temporalmente en el frontend
      const tempEvent: Event = {
        id: Date.now().toString(),
        title: eventData.title,
        start: `${eventData.startDate}T${eventData.startTime}:00`,
        end: `${eventData.endDate}T${eventData.endTime}:00`,
        backgroundColor: eventData.backgroundColor,
        extendedProps: {
          teacher: eventData.teacher,
          room: eventData.room,
          students: eventData.students,
          subject: eventData.subject
        }
      };
      setEvents(prev => [...prev, tempEvent]);
    }
  };

  // Función para actualizar evento
  const handleEventUpdate = async (id: string, eventData: CreateEventData) => {
    try {
      const updatedEvent = await eventService.updateEvent(id, eventData);
      setEvents(prev => prev.map(event => event.id === id ? updatedEvent : event));
    } catch (error) {
      console.error('Error updating event:', error);
      // En caso de error del backend, actualizar temporalmente en el frontend
      const tempEvent: Event = {
        id,
        title: eventData.title,
        start: `${eventData.startDate}T${eventData.startTime}:00`,
        end: `${eventData.endDate}T${eventData.endTime}:00`,
        backgroundColor: eventData.backgroundColor,
        extendedProps: {
          teacher: eventData.teacher,
          room: eventData.room,
          students: eventData.students,
          subject: eventData.subject
        }
      };
      setEvents(prev => prev.map(event => event.id === id ? tempEvent : event));
    }
  };

  // Función para eliminar evento
  const handleEventDelete = async (id: string) => {
    try {
      await eventService.deleteEvent(id);
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (error) {
      console.error('Error deleting event:', error);
      // En caso de error del backend, eliminar temporalmente del frontend
      setEvents(prev => prev.filter(event => event.id !== id));
    }
  };

  // Cargar eventos cuando cambia el bimestre
  useEffect(() => {
    loadEvents();
  }, [bimestreSeleccionado]);

  // Eventos de ejemplo para desarrollo
  const mockEvents: Event[] = [
    {
      id: '1',
      title: 'Matemáticas I - Prof. García',
      start: '2025-06-15T09:00:00',
      end: '2025-06-15T10:30:00',
      backgroundColor: '#3B82F6',
      extendedProps: {
        teacher: 'Prof. García',
        room: 'Aula 101',
        students: 30
      }
    },
    {
      id: '2', 
      title: 'Física II - Prof. López',
      start: '2025-06-15T11:00:00',
      end: '2025-06-15T12:30:00',
      backgroundColor: '#10B981',
      extendedProps: {
        teacher: 'Prof. López',
        room: 'Lab. Física',
        students: 25
      }
    },
    {
      id: '3',
      title: 'Química Orgánica - Prof. Martínez',
      start: '2025-06-16T14:00:00',
      end: '2025-06-16T15:30:00',
      backgroundColor: '#F59E0B',
      extendedProps: {
        teacher: 'Prof. Martínez',
        room: 'Lab. Química',
        students: 20
      }
    }
  ];

  const stats = [
    {
      title: 'Total Eventos',
      value: '156',
      icon: '📅',
      color: 'bg-uc-yellow',
      change: '+12%'
    },
    {
      title: 'Docentes Activos',
      value: '23',
      icon: '👨‍🏫',
      color: 'bg-blue-500',
      change: '+5%'
    },
    {
      title: 'Aulas Utilizadas',
      value: '18',
      icon: '🏛️',
      color: 'bg-orange-500',
      change: '+8%'
    },
    {
      title: 'Pendientes Aprobación',
      value: '7',
      icon: '⏳',
      color: 'bg-red-500',
      change: '-3%'
    }
  ];
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Dashboard de Programación Académica</h1>
        <p className="text-sm sm:text-base text-gray-600">Gestiona y visualiza la programación académica en tiempo real</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className={`text-xs sm:text-sm ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'} mt-1`}>
                  {stat.change} vs mes anterior
                </p>
              </div>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-lg sm:text-xl flex-shrink-0 ml-3`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>      {/* Calendar Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">        {/* Calendar Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col space-y-4">
            {/* Título y descripción */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">Calendario de Programación</h2>
                <p className="text-xs sm:text-sm text-gray-600">Visualiza y gestiona los eventos académicos</p>
              </div>              <div className="flex items-center">
                {/* Configurador de Bimestres */}
                <button
                  onClick={() => setIsConfiguradorOpen(true)}
                  className="bg-uc-yellow hover:bg-yellow-500 text-black px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  <CogIcon className="h-4 w-4" />
                  <span>Nuevo Evento</span>
                </button>
              </div>
            </div>
              {/* Selector de Bimestre y Controles de Vista */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Selector de Bimestre */}
              <BimestreSelector 
                onBimestreChange={(bimestreId) => {
                  console.log('Bimestre seleccionado:', bimestreId);
                }}
                className="flex-1 sm:flex-none"
              />
            </div>
          </div>
        </div>        {/* Calendar Content */}
        <div className="p-3 sm:p-6">
          <CalendarView 
            events={events}
            bimestreSeleccionado={bimestreSeleccionado}
            onEventCreate={handleEventCreate}
            onEventUpdate={handleEventUpdate}
            onEventDelete={handleEventDelete}
          />
        </div>
      </div>      {/* Quick Actions */}
      <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Acciones Rápidas</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center">
                <span className="text-xl mr-3">📋</span>
                <div>
                  <div className="font-medium text-gray-900">Crear Evento</div>
                  <div className="text-sm text-gray-600">Agregar nueva clase o actividad</div>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center">
                <span className="text-xl mr-3">📊</span>
                <div>
                  <div className="font-medium text-gray-900">Ver Reportes</div>
                  <div className="text-sm text-gray-600">Generar reportes de programación</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Eventos Recientes</h3>
          <div className="space-y-3">
            {mockEvents.slice(0, 2).map((event, index) => (
              <div key={index} className="p-3 rounded-lg bg-gray-50">
                <div className="font-medium text-gray-900 text-sm">{event.title}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {new Date(event.start).toLocaleString('es-ES', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Notificaciones</h3>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="font-medium text-yellow-800 text-sm">7 eventos pendientes de aprobación</div>
              <div className="text-xs text-yellow-600 mt-1">Requieren revisión</div>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="font-medium text-blue-800 text-sm">Nueva actualización disponible</div>
              <div className="text-xs text-blue-600 mt-1">Sistema actualizado</div>
            </div>
          </div>        </div>
      </div>

      {/* Modal de Configuración de Bimestres */}
      <BimestreConfigurador
        isOpen={isConfiguradorOpen}
        onClose={() => setIsConfiguradorOpen(false)}
      />
    </div>
  );
};

export default DashboardPage;
