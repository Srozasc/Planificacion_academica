import apiClient from './apiClient';

export interface User {
  id: number;
  emailInstitucional: string;
  name: string;
  telefono?: string;
  roleId: number;
  roleName?: string;
  roleExpiresAt?: string;
  previousRoleId?: number;
  previousRoleName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsersListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface QueryUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: number;
  isActive?: boolean;
}

export interface CreateUserData {
  emailInstitucional: string;
  password: string;
  name: string;
  telefono?: string;
  roleId: number;
  roleExpiresAt?: string;
  previousRoleId?: number;
  tipoPermiso?: 'categoria' | 'carrera';
  categoria?: string;
  carreras?: number[];
}

export interface AdminChangePasswordData {
  userId: number;
  newPassword: string;
  adminPassword: string;
}

export interface ImportResult {
  success: boolean;
  message: string;
  details?: {
    processed: number;
    created: number;
    updated: number;
    errors: number;
    errorDetails?: string[];
  };
}

class UsersService {
  private baseUrl = '/users';

  async getUsers(params?: QueryUsersParams): Promise<UsersListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.roleId) queryParams.append('roleId', params.roleId.toString());
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

      const url = queryParams.toString() ? `${this.baseUrl}?${queryParams.toString()}` : this.baseUrl;
      const response = await apiClient.get<UsersListResponse>(url);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUserById(id: number): Promise<User | null> {
    try {
      const response = await apiClient.get<User>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<User>(`${this.baseUrl}/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async createUser(userData: CreateUserData, bimestreId?: number): Promise<User> {
    try {
      const url = bimestreId ? `${this.baseUrl}?bimestreId=${bimestreId}` : this.baseUrl;
      const response = await apiClient.post<User>(url, userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async deleteUser(id: number): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async adminChangePassword(passwordData: AdminChangePasswordData): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(`${this.baseUrl}/admin-change-password`, passwordData);
      return response.data;
    } catch (error) {
      console.error('Error changing user password:', error);
      throw error;
    }
  }

  async importUsers(formData: FormData): Promise<ImportResult> {
    try {
      const response = await apiClient.post<ImportResult>(`${this.baseUrl}/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error importing users:', error);
      // Si el error tiene una respuesta del servidor, usar esa información
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Error al importar usuarios');
      }
      throw new Error('Error al importar usuarios');
    }
  }
}

const usersService = new UsersService();
export default usersService;