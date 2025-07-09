import React, { useState, useEffect } from 'react';
import CalendarView from '../components/dashboard/CalendarView';
import BimestreSelector from '../components/bimestres/BimestreSelector';
import BimestreConfigurador from '../components/bimestres/BimestreConfigurador';
import Toast from '../components/ui/Toast';
import { CogIcon } from '@heroicons/react/24/outline';
import { useBimestreStore } from '../store/bimestre.store';
import { eventService, Event } from '../services/event.service';
import { CreateEventData } from '../components/events/EventModal';
import { useToast } from '../hooks/useToast';

const DashboardPage: React.FC = () => {
  const [isConfiguradorOpen, setIsConfiguradorOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const { bimestreSeleccionado } = useBimestreStore();
  const { toast, showToast, hideToast } = useToast();

  // Función para cargar eventos
  const loadEvents = async () => {
    setIsLoadingEvents(true);
    try {
      let startDate, endDate;
      
      if (bimestreSeleccionado) {
        startDate = bimestreSeleccionado.fechaInicio;
        endDate = bimestreSeleccionado.fechaFin;
        console.log('Cargando eventos para bimestre:', { startDate, endDate });
      } else {
        console.log('No hay bimestre seleccionado, cargando todos los eventos');
      }
      
      const fetchedEvents = await eventService.getEvents(startDate, endDate);
      console.log('Eventos obtenidos del backend:', fetchedEvents);
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error loading events from backend:', error);
      console.log('Usando eventos de ejemplo como fallback');
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
    } catch (error: any) {
      console.error('Error creating event:', error);
      
      // Extraer mensaje de error del backend
      let errorMessage = 'Error al crear el evento';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Mostrar error al usuario usando toast
      showToast(errorMessage, 'error');
      
      // NO crear evento temporal - el error debe ser manejado correctamente
      throw error; // Re-lanzar para que el componente padre pueda manejarlo
    }
  };

  // Función para actualizar evento
  const handleEventUpdate = async (id: string, eventData: CreateEventData) => {
    try {
      const updatedEvent = await eventService.updateEvent(id, eventData);
      setEvents(prev => prev.map(event => event.id === id ? updatedEvent : event));
    } catch (error: any) {
      console.error('Error updating event:', error);
      
      // Extraer mensaje de error del backend
      let errorMessage = 'Error al actualizar el evento';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Mostrar error al usuario usando toast
      showToast(errorMessage, 'error');
      
      // NO actualizar temporalmente - el error debe ser manejado correctamente
      throw error;
    }
  };

  // Función para eliminar evento
  const handleEventDelete = async (id: string) => {
    try {
      await eventService.deleteEvent(id);
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (error: any) {
      console.error('Error deleting event:', error);
      
      // Extraer mensaje de error del backend
      let errorMessage = 'Error al eliminar el evento';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Mostrar error al usuario usando toast
      showToast(errorMessage, 'error');
      
      // NO eliminar temporalmente - el error debe ser manejado correctamente
      throw error;
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
              </div>              <div className="flex items-center space-x-3">
                {/* Configurador de Bimestres */}
                <button
                  onClick={() => setIsConfiguradorOpen(true)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  <CogIcon className="h-4 w-4" />
                  <span>Configurar Bimestres</span>
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
      </div>

      {/* Modal de Configuración de Bimestres */}
      <BimestreConfigurador
        isOpen={isConfiguradorOpen}
        onClose={() => setIsConfiguradorOpen(false)}
      />
      
      {/* Toast Container */}
       <Toast
         message={toast.message}
         type={toast.type}
         isVisible={toast.isVisible}
         onClose={hideToast}
       />
    </div>
  );
};

export default DashboardPage;
