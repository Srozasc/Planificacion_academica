import usersService from 'src/services/users.service';
import apiClient from 'src/services/apiClient';

// Mock de apiClient (axios instance)
jest.mock('src/services/apiClient', () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('UsersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('debería obtener una lista de usuarios sin parámetros', async () => {
      const mockResponse = { users: [{ id: 1, name: 'Test User' }], total: 1, page: 1, limit: 10 };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await usersService.getUsers();

      expect(apiClient.get).toHaveBeenCalledWith('/users');
      expect(result).toEqual(mockResponse);
    });

    it('debería obtener una lista de usuarios con parámetros de consulta', async () => {
      const mockResponse = { users: [{ id: 1, name: 'Test User' }], total: 1, page: 1, limit: 5 };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const params = { page: 1, limit: 5, search: 'test', roleId: 1, isActive: true };
      const result = await usersService.getUsers(params);

      expect(apiClient.get).toHaveBeenCalledWith('/users?page=1&limit=5&search=test&roleId=1&isActive=true');
      expect(result).toEqual(mockResponse);
    });

    it('debería lanzar un error si la obtención de usuarios falla', async () => {
      const mockError = new Error('Failed to fetch users');
      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(usersService.getUsers()).rejects.toThrow(mockError);
    });
  });

  describe('getUserById', () => {
    it('debería obtener un usuario por ID', async () => {
      const mockUser = { id: 1, name: 'Test User' };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockUser });

      const result = await usersService.getUserById(1);

      expect(apiClient.get).toHaveBeenCalledWith('/users/1');
      expect(result).toEqual(mockUser);
    });

    it('debería retornar null si el usuario no es encontrado', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue({ response: { status: 404 } }); // Simular 404

      const result = await usersService.getUserById(99);

      expect(apiClient.get).toHaveBeenCalledWith('/users/99');
      expect(result).toBeNull();
    });

    it('debería retornar null si la obtención del usuario falla (no 404)', async () => {
      const mockError = new Error('Network error');
      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      const result = await usersService.getUserById(1);

      expect(apiClient.get).toHaveBeenCalledWith('/users/1');
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('debería crear un nuevo usuario', async () => {
      const mockNewUser = { id: 2, name: 'New User', emailInstitucional: 'new@example.com' };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockNewUser });

      const userData = { emailInstitucional: 'new@example.com', password: 'pass', name: 'New User', roleId: 1 };
      const result = await usersService.createUser(userData);

      expect(apiClient.post).toHaveBeenCalledWith('/users', userData);
      expect(result).toEqual(mockNewUser);
    });

    it('debería lanzar un error si la creación del usuario falla', async () => {
      const mockError = new Error('Creation failed');
      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      const userData = { emailInstitucional: 'fail@example.com', password: 'pass', name: 'Fail User', roleId: 1 };
      await expect(usersService.createUser(userData)).rejects.toThrow(mockError);
    });
  });

  describe('updateUser', () => {
    it('debería actualizar un usuario existente', async () => {
      const mockUpdatedUser = { id: 1, name: 'Updated Name', emailInstitucional: 'test@example.com' };
      (apiClient.put as jest.Mock).mockResolvedValue({ data: mockUpdatedUser });

      const userData = { name: 'Updated Name' };
      const result = await usersService.updateUser(1, userData);

      expect(apiClient.put).toHaveBeenCalledWith('/users/1', userData);
      expect(result).toEqual(mockUpdatedUser);
    });

    it('debería lanzar un error si la actualización del usuario falla', async () => {
      const mockError = new Error('Update failed');
      (apiClient.put as jest.Mock).mockRejectedValue(mockError);

      const userData = { name: 'Fail Update' };
      await expect(usersService.updateUser(1, userData)).rejects.toThrow(mockError);
    });
  });

  describe('deleteUser', () => {
    it('debería eliminar un usuario', async () => {
      const mockDeleteResponse = { message: 'User deleted' };
      (apiClient.delete as jest.Mock).mockResolvedValue({ data: mockDeleteResponse });

      const result = await usersService.deleteUser(1);

      expect(apiClient.delete).toHaveBeenCalledWith('/users/1');
      expect(result).toEqual(mockDeleteResponse);
    });

    it('debería lanzar un error si la eliminación del usuario falla', async () => {
      const mockError = new Error('Delete failed');
      (apiClient.delete as jest.Mock).mockRejectedValue(mockError);

      await expect(usersService.deleteUser(1)).rejects.toThrow(mockError);
    });
  });
});
