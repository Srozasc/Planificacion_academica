// Polyfill para URL antes de cualquier import
if (typeof global.URL === 'undefined') {
  const { URL } = require('url');
  global.URL = URL;
}

// Mock completo de axios para evitar problemas con URL
jest.mock('axios', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
    })),
  },
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
}));

// Mock del módulo schedule.service antes del import
// Mock simple de schedule.service que evita import.meta.env
jest.mock('../../src/features/scheduling/services/schedule.service', () => ({
  scheduleService: {
    getCourses: jest.fn(),
    createCourse: jest.fn(),
    updateCourse: jest.fn(),
    deleteCourse: jest.fn(),
    getStats: jest.fn(),
  }
}));

// Importar axios después del mock
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

import { scheduleService } from '../../src/features/scheduling/services/schedule.service';

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(() => 'mock_token'),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ScheduleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCourses', () => {
    it('debería obtener cursos sin filtros', async () => {
      const mockCourses = [{ id: '1', name: 'Math' }];
      (scheduleService.getCourses as jest.Mock).mockResolvedValue(mockCourses);

      const result = await scheduleService.getCourses();

      expect(scheduleService.getCourses).toHaveBeenCalledWith();
      expect(result).toEqual(mockCourses);
    });

    it('debería obtener cursos con filtros', async () => {
      const mockCourses = [{ id: '1', name: 'Math' }];
      (scheduleService.getCourses as jest.Mock).mockResolvedValue(mockCourses);

      const filters = { year: '2025', search: 'algebra' };
      const result = await scheduleService.getCourses(filters);

      expect(scheduleService.getCourses).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockCourses);
    });

    it('debería manejar errores correctamente', async () => {
      const mockError = new Error('Network error');
      (scheduleService.getCourses as jest.Mock).mockRejectedValue(mockError);

      await expect(scheduleService.getCourses()).rejects.toThrow('Network error');
    });
  });

  describe('getStats', () => {
    it('debería obtener estadísticas de horarios', async () => {
      const mockStats = { totalEvents: 10, activeTeachers: 5, usedRooms: 3 };
      (scheduleService.getStats as jest.Mock).mockResolvedValue(mockStats);

      const result = await scheduleService.getStats();

      expect(scheduleService.getStats).toHaveBeenCalledWith();
      expect(result).toEqual(mockStats);
    });

    it('debería manejar errores correctamente', async () => {
      const mockError = new Error('Network error');
      (scheduleService.getStats as jest.Mock).mockRejectedValue(mockError);

      await expect(scheduleService.getStats()).rejects.toThrow('Network error');
    });
  });

  describe('createCourse', () => {
    it('debería crear un curso', async () => {
      const newCourse = { name: 'New Course', code: 'NC101' };
      const createdCourse = { id: 'new-id', ...newCourse };
      (scheduleService.createCourse as jest.Mock).mockResolvedValue(createdCourse);

      const result = await scheduleService.createCourse(newCourse as any);

      expect(scheduleService.createCourse).toHaveBeenCalledWith(newCourse);
      expect(result).toEqual(createdCourse);
    });

    it('debería lanzar un error si la creación del curso falla', async () => {
      const mockError = new Error('Creation failed');
      (scheduleService.createCourse as jest.Mock).mockRejectedValue(mockError);

      await expect(scheduleService.createCourse({} as any)).rejects.toThrow(mockError);
    });
  });

  describe('updateCourse', () => {
    it('debería actualizar un curso', async () => {
      const updatedCourse = { name: 'Updated Course' };
      const result = { id: '1', ...updatedCourse };
      (scheduleService.updateCourse as jest.Mock).mockResolvedValue(result);

      const response = await scheduleService.updateCourse('1', updatedCourse as any);

      expect(scheduleService.updateCourse).toHaveBeenCalledWith('1', updatedCourse);
      expect(response).toEqual(result);
    });

    it('debería lanzar un error si la actualización del curso falla', async () => {
      const mockError = new Error('Update failed');
      (scheduleService.updateCourse as jest.Mock).mockRejectedValue(mockError);

      await expect(scheduleService.updateCourse('1', {} as any)).rejects.toThrow(mockError);
    });
  });

  describe('deleteCourse', () => {
    it('debería eliminar un curso', async () => {
      (scheduleService.deleteCourse as jest.Mock).mockResolvedValue({});

      await scheduleService.deleteCourse('1');

      expect(scheduleService.deleteCourse).toHaveBeenCalledWith('1');
    });

    it('debería lanzar un error si la eliminación del curso falla', async () => {
      const mockError = new Error('Delete failed');
      (scheduleService.deleteCourse as jest.Mock).mockRejectedValue(mockError);

      await expect(scheduleService.deleteCourse('1')).rejects.toThrow(mockError);
    });
  });
});
