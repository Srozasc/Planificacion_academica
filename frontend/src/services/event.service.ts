import apiClient from './apiClient';
import { CreateEventData } from '../components/events/EventModal';

export interface Event {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  backgroundColor?: string;
  extendedProps?: {
    teacher?: string;
    room?: string;
    students?: number;
    subject?: string;
  };
}

class EventService {
  private baseUrl = '/events';

  async getEvents(startDate?: string, endDate?: string): Promise<Event[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const response = await apiClient.get(`${this.baseUrl}?${params.toString()}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  }

  async createEvent(eventData: CreateEventData): Promise<Event> {
    try {
      // Convertir CreateEventData a formato esperado por el backend
      const event: any = {
        title: eventData.title,
        description: eventData.description,
        start_date: `${eventData.startDate}T${eventData.startTime}:00`,
        end_date: `${eventData.endDate}T${eventData.endTime}:00`,
        teacher: eventData.teacher,
        subject: eventData.subject,
        room: eventData.room,
        background_color: eventData.backgroundColor
      };
      
      // Solo incluir students si es mayor que 0
      if (eventData.students && eventData.students > 0) {
        event.students = eventData.students;
      }

      const response = await apiClient.post(this.baseUrl, event);
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating event:', error);
      // Extraer mensaje de error del formato ApiResponse
      const errorMessage = this.extractErrorMessage(error);
      throw new Error(errorMessage);
    }
  }

  async updateEvent(id: string, eventData: CreateEventData): Promise<Event> {
    try {
      // Convertir CreateEventData a formato esperado por el backend
      const event: any = {
        title: eventData.title,
        description: eventData.description,
        start_date: `${eventData.startDate}T${eventData.startTime}:00`,
        end_date: `${eventData.endDate}T${eventData.endTime}:00`,
        teacher: eventData.teacher,
        subject: eventData.subject,
        room: eventData.room,
        background_color: eventData.backgroundColor
      };
      
      // Solo incluir students si es mayor que 0
      if (eventData.students && eventData.students > 0) {
        event.students = eventData.students;
      }

      const response = await apiClient.put(`${this.baseUrl}/${id}`, event);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating event:', error);
      // Extraer mensaje de error del formato ApiResponse
      const errorMessage = this.extractErrorMessage(error);
      throw new Error(errorMessage);
    }
  }

  async deleteEvent(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`);
    } catch (error: any) {
      console.error('Error deleting event:', error);
      // Extraer mensaje de error del formato ApiResponse
      const errorMessage = this.extractErrorMessage(error);
      throw new Error(errorMessage);
    }
  }

  // Método para extraer mensaje de error del formato ApiResponse
  private extractErrorMessage(error: any): string {
    // Si el error tiene response.data (respuesta del servidor)
    if (error.response?.data) {
      const errorData = error.response.data;
      
      // Si es formato ApiResponse
      if (errorData.message) {
        return this.formatFriendlyErrorMessage(errorData.message);
      }
      
      // Si hay errores específicos
      if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        return errorData.errors.map((err: any) => this.formatFriendlyErrorMessage(err)).join(', ');
      }
    }
    
    // Si el error tiene un mensaje directo
    if (error.message) {
      return this.formatFriendlyErrorMessage(error.message);
    }
    
    // Mensaje por defecto
    return 'Error desconocido al procesar la solicitud';
  }

  // Método para formatear mensajes de error de manera amigable
  private formatFriendlyErrorMessage(message: string): string {
    // Detectar conflicto de horario
    if (message.includes('Conflicto de horario') || message.includes('sala ya está ocupada')) {
      // Extraer información del aula si está disponible
      const aulaMatch = message.match(/sala "([^"]+)"/i) || message.match(/aula "([^"]+)"/i);
      const aula = aulaMatch ? aulaMatch[1] : 'la sala seleccionada';
      
      return `🚫 ¡Ups! ${aula} ya está reservada en ese horario.\n\n💡 Por favor, elige otro horario o una sala diferente.`;
    }
    
    // Detectar error de fechas
    if (message.includes('fecha de fin debe ser posterior')) {
      return `📅 La fecha y hora de finalización debe ser posterior al inicio.\n\n💡 Verifica que las fechas y horarios estén correctos.`;
    }
    
    // Detectar errores de validación
    if (message.includes('requerido') || message.includes('required')) {
      return `📝 Faltan campos obligatorios por completar.\n\n💡 Revisa que todos los campos marcados con (*) estén llenos.`;
    }
    
    // Para otros errores, mantener el mensaje original pero con un emoji
    return `⚠️ ${message}`;
  }

  // Métodos de utilidad
  formatEventDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatEventTime(date: string): string {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

export const eventService = new EventService();
export default EventService;
