import React, { useState, useEffect } from 'react';
import BimestreSelector from '../components/bimestres/BimestreSelector';
import EventModal from '../components/events/EventModal';
import BimestreConfigurador from '../components/bimestres/BimestreConfigurador';
import Toast from '../components/ui/Toast';
import { CogIcon } from '@heroicons/react/24/outline';
import { useBimestreStore } from '../store/bimestre.store';
import { useAuthStore } from '../store/auth.store';
import { eventService, Event } from '../services/event.service';
import { CreateEventData } from '../components/events/EventModal';
import { useToast } from '../hooks/useToast';


const DashboardPage: React.FC = () => {
  const [isConfiguradorOpen, setIsConfiguradorOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  const { bimestreSeleccionado } = useBimestreStore();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { toast, showToast, hideToast } = useToast();





  // Función para cargar eventos
  const loadEvents = async () => {
    setIsLoadingEvents(true);
    try {
      let startDate, endDate;
      
      if (bimestreSeleccionado) {
        startDate = bimestreSeleccionado.fechaInicio;
        endDate = bimestreSeleccionado.fechaFin;
        console.log('🔍 Cargando eventos para bimestre:', { 
          bimestreId: bimestreSeleccionado.id,
          nombre: bimestreSeleccionado.nombre,
          startDate, 
          endDate 
        });
      } else {
        console.log('🔍 No hay bimestre seleccionado, cargando todos los eventos');
      }
      
      console.log('📡 Llamando a eventService.getEvents con parámetros:', { startDate, endDate });
      const fetchedEvents = await eventService.getEvents(startDate, endDate);
      console.log('✅ Eventos obtenidos del backend:', {
        cantidad: fetchedEvents.length,
        eventos: fetchedEvents.map(e => ({
          id: e.id,
          title: e.title,
          start: e.start,
          end: e.end
        }))
      });
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('❌ Error loading events from backend:', error);
      // En caso de error, mostrar array vacío
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Función para abrir modal de creación de evento
  const handleCreateEventClick = () => {
    setEditingEvent(null);
    setSelectedDate(undefined); // No establecer fecha específica para usar fechas del bimestre
    setIsEventModalOpen(true);
  };

  // Función para abrir modal de edición de evento
  const handleEditEventClick = async (event: Event) => {
    try {
      // Obtener los datos completos del evento
      const fullEvent = await eventService.getEventById(event.id);
      setEditingEvent(fullEvent);
      setSelectedDate(undefined);
      setIsEventModalOpen(true);
    } catch (error) {
      console.error('Error loading event details:', error);
      // En caso de error, usar los datos básicos del evento
      setEditingEvent(event);
      setSelectedDate(undefined);
      setIsEventModalOpen(true);
    }
  };

  // Función para manejar el guardado de eventos (crear o actualizar)
  const handleEventSave = async (eventData: CreateEventData) => {
    setIsCreatingEvent(true);
    try {
      if (editingEvent) {
        await handleEventUpdate(editingEvent.id, eventData);
      } else {
        await handleEventCreate(eventData);
      }
      setIsEventModalOpen(false);
      setEditingEvent(null);
      setSelectedDate(undefined);
    } catch (error) {
      console.error('Error saving event:', error);
      // NO cerrar el modal para que el usuario pueda ver el error y corregir
    } finally {
      setIsCreatingEvent(false);
    }
  };

  // Función para cerrar el modal
  const handleModalClose = () => {
    setIsEventModalOpen(false);
    setEditingEvent(null);
    setSelectedDate(undefined);
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

  // Cargar datos cuando cambia el bimestre
  useEffect(() => {
    loadEvents();
  }, [bimestreSeleccionado]);





  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Dashboard de Programación Académica</h1>
        <p className="text-sm sm:text-base text-gray-600">Gestiona y visualiza la programación académica en tiempo real</p>
      </div>

      {/* Total de eventos */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 w-fit">
          <div className="flex items-center space-x-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Eventos</p>
              <p className="text-2xl font-bold text-gray-900">{events.length}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        {/* Calendar Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col space-y-4">
            {/* Título y descripción */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">Calendario de Programación</h2>
                <p className="text-xs sm:text-sm text-gray-600">Visualiza y gestiona los eventos académicos</p>
              </div>
              <div className="flex items-center space-x-3">
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
        </div>
        
        {/* Calendar Content - Vista removida, funcionalidad mantenida */}
        <div className="p-3 sm:p-6">
          <div className="space-y-4">
            {/* Botón para crear nuevo evento */}
             <div className="flex justify-end items-center mb-4">
               <button
                  onClick={handleCreateEventClick}
                  className="bg-uc-yellow hover:bg-yellow-500 text-black px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  <span>+</span>
                  <span>Crear Evento</span>
                </button>
             </div>
            
            {/* Lista de eventos */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Eventos Programados ({events.length})</h3>
              {events.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {events.map(event => (
                    <div key={event.id} className="bg-white p-3 rounded border flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(event.start).toLocaleDateString('es-ES')} - {new Date(event.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                           onClick={() => handleEditEventClick(event)}
                           className="text-blue-600 hover:text-blue-800 text-sm"
                         >
                           Editar
                         </button>
                        <button
                          onClick={() => handleEventDelete(event.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay eventos programados</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Configuración de Bimestres */}
      <BimestreConfigurador
        isOpen={isConfiguradorOpen}
        onClose={() => setIsConfiguradorOpen(false)}
      />
      
      {/* Modal para crear/editar eventos */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={handleModalClose}
        selectedDate={selectedDate}
        onSave={handleEventSave}
        isLoading={isCreatingEvent}
        editingEvent={editingEvent}
        onMultipleEventsCreated={async () => {
          // Recargar eventos cuando se crean múltiples eventos
          await loadEvents();
        }}
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
