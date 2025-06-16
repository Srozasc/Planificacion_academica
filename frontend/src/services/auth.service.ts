import apiClient from './apiClient';

// Types
export interface LoginRequest {
  email_institucional: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    roleId: number;
    isActive: boolean;
  };
  permissions: string[];
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: number;
  isActive: boolean;
}

export interface ValidateTokenResponse {
  valid: boolean;
  user?: UserProfile;
  permissions?: string[];
}

class AuthService {  // Login
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      
      if (response.data.access_token) {
        this.setToken(response.data.access_token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      this.removeToken();
    }
  }

  // Obtener perfil del usuario
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await apiClient.get<UserProfile>('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      throw error;
    }
  }

  // Validar token
  async validateToken(): Promise<ValidateTokenResponse> {
    try {
      const response = await apiClient.get<ValidateTokenResponse>('/auth/validate');
      return response.data;
    } catch (error) {
      console.error('Error validando token:', error);
      return { valid: false };
    }
  }  // Gestión del token en localStorage
  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  removeToken(): void {
    localStorage.removeItem('token');
  }

  // Verificar si hay token almacenado
  hasToken(): boolean {
    return !!this.getToken();
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return this.hasToken();
  }
}

export const authService = new AuthService();
