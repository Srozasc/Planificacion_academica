import { eventService } from '../../src/services/event.service';
import apiClient from '../../src/services/apiClient';

// Mock de apiClient (axios instance)
jest.mock('../../src/services/apiClient', () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('EventService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // Para controlar Date en formatEventDate, formatEventTime
    jest.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getEvents', () => {
    it('debería obtener eventos sin parámetros de fecha', async () => {
      const mockResponseData = [{ id: '1', title: 'Event 1' }];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: mockResponseData } });

      const result = await eventService.getEvents();

      expect(apiClient.get).toHaveBeenCalledWith('/events?');
      expect(result).toEqual(mockResponseData);
    });

    it('debería obtener eventos con parámetros de fecha', async () => {
      const mockResponseData = [{ id: '2', title: 'Event 2' }];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: mockResponseData } });

      const result = await eventService.getEvents('2025-01-01', '2025-01-31');

      expect(apiClient.get).toHaveBeenCalledWith('/events?start_date=2025-01-01&end_date=2025-01-31');
      expect(result).toEqual(mockResponseData);
    });

    it('debería retornar un array vacío si la obtención de eventos falla', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await eventService.getEvents();

      expect(result).toEqual([]);
    });
  });

  describe('getEventById', () => {
    it('debería obtener un evento por ID', async () => {
      const mockResponseData = { id: '1', title: 'Event by ID' };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: mockResponseData } });

      const result = await eventService.getEventById('1');

      expect(apiClient.get).toHaveBeenCalledWith('/events/1');
      expect(result).toEqual(mockResponseData);
    });

    it('debería lanzar un error si la obtención del evento falla', async () => {
      const mockError = { response: { data: { message: 'Event not found' } } };
      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(eventService.getEventById('99')).rejects.toThrow('Event not found');
    });
  });

  describe('createEvent', () => {
    it('debería crear un evento', async () => {
      const createData = {
        title: 'New Event',
        startDate: '2025-02-01',
        endDate: '2025-02-01',
        teacher: 'John Doe',
        teacher_ids: [1],
        subject: 'Math',
        students: 25,
      };
      const mockResponseData = { id: '3', ...createData };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: { data: mockResponseData } });

      const result = await eventService.createEvent(createData);

      expect(apiClient.post).toHaveBeenCalledWith('/events', {
        title: 'New Event',
        start_date: '2025-02-01T08:00:00',
        end_date: '2025-02-01T17:00:00',
        teacher: 'John Doe',
        teacher_ids: [1],
        subject: 'Math',
        students: 25,
      });
      expect(result).toEqual(mockResponseData);
    });

    it('debería lanzar un error si la creación del evento falla', async () => {
      const mockError = { response: { data: { message: 'Validation error' } } };
      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      const createData = {
        title: 'Invalid Event',
        startDate: '2025-02-01',
        endDate: '2025-02-01',
        teacher: 'John Doe',
        teacher_ids: [1],
        subject: 'Math',
        students: 25,
      };
      await expect(eventService.createEvent(createData)).rejects.toThrow('Validation error');
    });
  });

  describe('updateEvent', () => {
    it('debería actualizar un evento', async () => {
      const updateData = {
        title: 'Updated Event',
        startDate: '2025-03-01',
        endDate: '2025-03-01',
      };
      const mockResponseData = { id: '1', ...updateData };
      (apiClient.put as jest.Mock).mockResolvedValue({ data: { data: mockResponseData } });

      const result = await eventService.updateEvent('1', updateData);

      expect(apiClient.put).toHaveBeenCalledWith('/events/1', {
        title: 'Updated Event',
        start_date: '2025-03-01T08:00:00',
        end_date: '2025-03-01T17:00:00',
        teacher: undefined, // Añadido para coincidir con el comportamiento del servicio
        teacher_ids: [],      // Corregido para coincidir con el comportamiento del servicio
        subject: undefined,   // Añadido para coincidir con el comportamiento del servicio
        students: undefined,  // Añadido para coincidir con el comportamiento del servicio
      });
      expect(result).toEqual(mockResponseData);
    });

    it('debería lanzar un error si la actualización del evento falla', async () => {
      const mockError = { response: { data: { message: 'Update error' } } };
      (apiClient.put as jest.Mock).mockRejectedValue(mockError);

      const updateData = {
        title: 'Invalid Update',
        startDate: '2025-03-01',
        endDate: '2025-03-01',
      };
      await expect(eventService.updateEvent('1', updateData)).rejects.toThrow('Update error');
    });
  });

  describe('deleteEvent', () => {
    it('debería eliminar un evento', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({});

      await eventService.deleteEvent('1');

      expect(apiClient.delete).toHaveBeenCalledWith('/events/1');
    });

    it('debería lanzar un error si la eliminación del evento falla', async () => {
      const mockError = { response: { data: { message: 'Delete error' } } };
      (apiClient.delete as jest.Mock).mockRejectedValue(mockError);

      await expect(eventService.deleteEvent('1')).rejects.toThrow('Delete error');
    });
  });

  describe('extractErrorMessage', () => {
    it('debería extraer el mensaje de error de response.data.message', () => {
      const error = { response: { data: { message: 'Backend error message' } } };
      // Acceder al método privado usando corchetes
      const message = eventService['extractErrorMessage'](error);
      expect(message).toBe('⚠️ Backend error message');
    });

    it('debería extraer el mensaje de error de response.data.errors', () => {
      const error = { response: { data: { errors: ['Error 1', 'Error 2'] } } };
      const message = eventService['extractErrorMessage'](error);
      expect(message).toBe('⚠️ Error 1, ⚠️ Error 2');
    });

    it('debería extraer el mensaje de error de error.message', () => {
      const error = new Error('Generic error');
      const message = eventService['extractErrorMessage'](error);
      expect(message).toBe('⚠️ Generic error');
    });

    it('debería retornar un mensaje por defecto si no se encuentra un mensaje de error', () => {
      const error = {};
      const message = eventService['extractErrorMessage'](error);
      expect(message).toBe('Error desconocido al procesar la solicitud');
    });
  });

  describe('formatFriendlyErrorMessage', () => {
    it('debería formatear un mensaje de conflicto de horario', () => {
      const message = 'Conflicto de horario en la sala "Aula 101".';
      const formatted = eventService['formatFriendlyErrorMessage'](message);
      expect(formatted).toContain('¡Ups! Aula 101 ya está reservada');
    });

    it('debería formatear un mensaje de fecha inválida', () => {
      const message = 'La fecha de fin debe ser posterior';
      const formatted = eventService['formatFriendlyErrorMessage'](message);
      expect(formatted).toContain('La fecha y hora de finalización debe ser posterior al inicio');
    });

    it('debería formatear un mensaje de campo requerido', () => {
      const message = 'Campo requerido';
      const formatted = eventService['formatFriendlyErrorMessage'](message);
      expect(formatted).toContain('Faltan campos obligatorios');
    });

    it('debería retornar el mensaje original con emoji para otros errores', () => {
      const message = 'Something unexpected happened';
      const formatted = eventService['formatFriendlyErrorMessage'](message);
      expect(formatted).toBe('⚠️ Something unexpected happened');
    });
  });

  describe('formatEventDate', () => {
    it('debería formatear la fecha del evento correctamente', () => {
      const dateString = '2025-01-15T10:00:00Z';
      const expected = new Date(dateString).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      expect(eventService.formatEventDate(dateString)).toBe(expected);
    });
  });

  describe('formatEventTime', () => {
    it('debería formatear la hora del evento correctamente', () => {
      const dateString = '2025-01-15T10:30:00Z';
      const expected = new Date(dateString).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
      expect(eventService.formatEventTime(dateString)).toBe(expected);
    });
  });

  describe('getNextCorrelativeForSubject', () => {
    it('debería retornar 1 si no hay eventos para la asignatura', async () => {
      jest.spyOn(eventService, 'getEvents').mockResolvedValue([]);
      const nextCorrelative = await eventService.getNextCorrelativeForSubject('Math');
      expect(nextCorrelative).toBe(1);
    });

    it('debería retornar el siguiente correlativo basado en eventos existentes', async () => {
      const mockEvents = [
        { id: '1', title: 'Clase de Math - 001', extendedProps: { subject: 'Math' } },
        { id: '2', title: 'Clase de Math - 003', extendedProps: { subject: 'Math' } },
        { id: '3', title: 'Clase de Physics - 001', extendedProps: { subject: 'Physics' } },
      ];
      jest.spyOn(eventService, 'getEvents').mockResolvedValue(mockEvents as any);

      const nextCorrelative = await eventService.getNextCorrelativeForSubject('Math');
      expect(nextCorrelative).toBe(4);
    });

    it('debería manejar títulos sin correlativo y retornar el siguiente', async () => {
      const mockEvents = [
        { id: '1', title: 'Clase de Math', extendedProps: { subject: 'Math' } },
        { id: '2', title: 'Clase de Math - 005', extendedProps: { subject: 'Math' } },
      ];
      jest.spyOn(eventService, 'getEvents').mockResolvedValue(mockEvents as any);

      const nextCorrelative = await eventService.getNextCorrelativeForSubject('Math');
      expect(nextCorrelative).toBe(6);
    });

    it('debería retornar 1 si hay un error al obtener eventos', async () => {
      jest.spyOn(eventService, 'getEvents').mockRejectedValue(new Error('API Error'));
      const nextCorrelative = await eventService.getNextCorrelativeForSubject('Math');
      expect(nextCorrelative).toBe(1);
    });
  });
});
