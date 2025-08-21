import { authService } from 'src/services/auth.service';
import apiClient from 'src/services/apiClient';

// Mock de apiClient (axios instance)
jest.mock('src/services/apiClient', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('debería autenticar al usuario y guardar el token', async () => {
      const mockLoginResponse = {
        access_token: 'mock_token',
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        permissions: [],
      };
      (apiClient.post as jest.Mock).mockResolvedValue({
        data: mockLoginResponse,
      });

      const credentials = { email_institucional: 'test@example.com', password: 'password123' };
      const result = await authService.login(credentials);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'mock_token');
      expect(result).toEqual(mockLoginResponse);
    });

    it('debería lanzar un error si el login falla', async () => {
      const mockError = new Error('Login failed');
      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      const credentials = { email_institucional: 'test@example.com', password: 'wrongpassword' };
      await expect(authService.login(credentials)).rejects.toThrow(mockError);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('debería llamar a la API de logout y remover el token', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({});

      await authService.logout();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    });

    it('debería remover el token incluso si la llamada a la API falla', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('API error'));

      await authService.logout();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('getProfile', () => {
    it('debería obtener el perfil del usuario', async () => {
      const mockProfile = { id: 1, email: 'test@example.com', name: 'Test User' };
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockProfile,
      });

      const result = await authService.getProfile();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/profile');
      expect(result).toEqual(mockProfile);
    });

    it('debería lanzar un error si la obtención del perfil falla', async () => {
      const mockError = new Error('Failed to get profile');
      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(authService.getProfile()).rejects.toThrow(mockError);
    });
  });

  describe('validateToken', () => {
    it('debería validar el token y retornar true con datos de usuario', async () => {
      const mockValidateResponse = { valid: true, user: { id: 1, email: 'test@example.com' } };
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockValidateResponse,
      });

      const result = await authService.validateToken();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/validate');
      expect(result).toEqual(mockValidateResponse);
    });

    it('debería retornar false si la validación del token falla', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      const result = await authService.validateToken();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/validate');
      expect(result).toEqual({ valid: false });
    });
  });

  describe('changePassword', () => {
    it('debería cambiar la contraseña exitosamente', async () => {
      const mockChangePasswordResponse = { message: 'Password changed' };
      (apiClient.post as jest.Mock).mockResolvedValue({
        data: mockChangePasswordResponse,
      });

      const passwordData = { currentPassword: 'old', newPassword: 'new' };
      const result = await authService.changePassword(passwordData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/change-password', passwordData);
      expect(result).toEqual(mockChangePasswordResponse);
    });

    it('debería lanzar un error si el cambio de contraseña falla', async () => {
      const mockError = new Error('Change password failed');
      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      const passwordData = { currentPassword: 'old', newPassword: 'new' };
      await expect(authService.changePassword(passwordData)).rejects.toThrow(mockError);
    });
  });

  describe('setToken', () => {
    it('debería guardar el token en localStorage', () => {
      authService.setToken('test_token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'test_token');
    });
  });

  describe('getToken', () => {
    it('debería obtener el token de localStorage', () => {
      localStorageMock.getItem.mockReturnValue('retrieved_token');
      const token = authService.getToken();
      expect(localStorageMock.getItem).toHaveBeenCalledWith('token');
      expect(token).toBe('retrieved_token');
    });

    it('debería retornar null si no hay token', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const token = authService.getToken();
      expect(token).toBeNull();
    });
  });

  describe('removeToken', () => {
    it('debería remover el token de localStorage', () => {
      authService.removeToken();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('hasToken', () => {
    it('debería retornar true si hay un token', () => {
      localStorageMock.getItem.mockReturnValue('some_token');
      expect(authService.hasToken()).toBe(true);
    });

    it('debería retornar false si no hay token', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(authService.hasToken()).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('debería retornar true si el usuario está autenticado (tiene token)', () => {
      localStorageMock.getItem.mockReturnValue('some_token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('debería retornar false si el usuario no está autenticado (no tiene token)', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getRoles', () => {
    it('debería obtener la lista de roles', async () => {
      const mockRoles = [{ id: 1, name: 'Admin', description: 'Admin role' }];
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockRoles,
      });

      const result = await authService.getRoles();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/roles');
      expect(result).toEqual(mockRoles);
    });

    it('debería lanzar un error si la obtención de roles falla', async () => {
      const mockError = new Error('Failed to get roles');
      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(authService.getRoles()).rejects.toThrow(mockError);
    });
  });
});
