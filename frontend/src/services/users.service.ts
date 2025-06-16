import apiClient from './apiClient';
import type { 
  User, 
  CreateUserDto, 
  UpdateUserDto, 
  QueryUsersDto, 
  PaginatedResponse 
} from '../types';

export class UsersService {
  private readonly basePath = '/users';

  /**
   * Obtener lista de usuarios con filtros y paginación
   */
  async getUsers(query?: QueryUsersDto): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams();
    
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.search) params.append('search', query.search);
    if (query?.role_id) params.append('role_id', query.role_id.toString());
    if (query?.is_active !== undefined) params.append('is_active', query.is_active.toString());

    const response = await apiClient.get<PaginatedResponse<User>>(
      `${this.basePath}?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Obtener un usuario por ID
   */
  async getUserById(id: number): Promise<User> {
    const response = await apiClient.get<User>(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Crear un nuevo usuario
   */
  async createUser(userData: CreateUserDto): Promise<User> {
    const response = await apiClient.post<User>(this.basePath, userData);
    return response.data;
  }

  /**
   * Actualizar un usuario existente
   */
  async updateUser(id: number, userData: UpdateUserDto): Promise<User> {
    const response = await apiClient.put<User>(`${this.basePath}/${id}`, userData);
    return response.data;
  }

  /**
   * Eliminar un usuario (soft delete)
   */
  async deleteUser(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Obtener roles disponibles (para selects)
   */
  async getRoles(): Promise<Array<{ id: number; name: string }>> {
    // Nota: Este endpoint podría necesitar ser implementado en el backend
    // Por ahora retornamos roles hardcodeados
    return [
      { id: 1, name: 'Administrador' },
      { id: 2, name: 'Director/Jefe de Programa' },
      { id: 3, name: 'Usuario Lector' }
    ];
  }
}

// Instancia singleton del servicio
export const usersService = new UsersService();
