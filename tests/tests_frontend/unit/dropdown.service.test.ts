import { dropdownService } from 'src/services/dropdownService';
import apiClient from 'src/services/apiClient';

// Mock de apiClient (axios instance)
jest.mock('src/services/apiClient', () => ({
  get: jest.fn(),
}));

describe('DropdownService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTeachers', () => {
    it('debería obtener una lista de profesores', async () => {
      const mockTeachers = [{ id: 1, name: 'Profesor 1' }];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockTeachers });

      const result = await dropdownService.getTeachers();

      expect(apiClient.get).toHaveBeenCalledWith('/dropdowns/teachers');
      expect(result).toEqual(mockTeachers);
    });

    it('debería retornar un array vacío si la obtención de profesores falla', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await dropdownService.getTeachers();

      expect(apiClient.get).toHaveBeenCalledWith('/dropdowns/teachers');
      expect(result).toEqual([]);
    });
  });

  describe('getSubjects', () => {
    it('debería obtener una lista de asignaturas', async () => {
      const mockSubjects = [{ id: 1, name: 'Matemáticas' }];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockSubjects });

      const result = await dropdownService.getSubjects();

      expect(apiClient.get).toHaveBeenCalledWith('/dropdowns/subjects');
      expect(result).toEqual(mockSubjects);
    });

    it('debería retornar un array vacío si la obtención de asignaturas falla', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await dropdownService.getSubjects();

      expect(apiClient.get).toHaveBeenCalledWith('/dropdowns/subjects');
      expect(result).toEqual([]);
    });
  });

  describe('getRooms', () => {
    it('debería obtener una lista de aulas', async () => {
      const mockRooms = [{ value: 'Aula 1', label: 'Aula 1' }];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockRooms });

      const result = await dropdownService.getRooms();

      expect(apiClient.get).toHaveBeenCalledWith('/dropdowns/rooms');
      expect(result).toEqual(mockRooms);
    });

    it('debería retornar un array vacío si la obtención de aulas falla', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await dropdownService.getRooms();

      expect(apiClient.get).toHaveBeenCalledWith('/dropdowns/rooms');
      expect(result).toEqual([]);
    });
  });
});
