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
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
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
      const event = {
        title: eventData.title,
        description: eventData.description,
        start_date: `${eventData.startDate}T${eventData.startTime}:00`,
        end_date: `${eventData.endDate}T${eventData.endTime}:00`,
        background_color: eventData.backgroundColor,
        teacher: eventData.teacher,
        room: eventData.room,
        students: eventData.students,
        subject: eventData.subject
      };

      const response = await apiClient.post(this.baseUrl, event);
      return response.data.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }
  async updateEvent(id: string, eventData: Partial<CreateEventData>): Promise<Event> {
    try {
      // Transformar los datos al formato esperado por el backend
      const updateData: any = { ...eventData };
      
      if (eventData.startDate && eventData.startTime) {
        updateData.start_date = `${eventData.startDate}T${eventData.startTime}:00`;
        delete updateData.startDate;
        delete updateData.startTime;
      }
      
      if (eventData.endDate && eventData.endTime) {
        updateData.end_date = `${eventData.endDate}T${eventData.endTime}:00`;
        delete updateData.endDate;
        delete updateData.endTime;
      }
      
      if (eventData.backgroundColor) {
        updateData.background_color = eventData.backgroundColor;
        delete updateData.backgroundColor;
      }

      const response = await apiClient.put(`${this.baseUrl}/${id}`, updateData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
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
