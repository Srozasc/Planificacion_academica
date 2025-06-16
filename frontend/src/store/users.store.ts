import { create } from 'zustand';
import { usersService } from '../services/users.service';
import type { 
  User, 
  CreateUserDto, 
  UpdateUserDto, 
  QueryUsersDto, 
  PaginatedResponse 
} from '../types';

interface UsersState {
  // Estado
  users: User[];
  selectedUser: User | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  // Filtros actuales
  currentQuery: QueryUsersDto;
  
  // Acciones
  fetchUsers: (query?: QueryUsersDto) => Promise<void>;
  fetchUserById: (id: number) => Promise<void>;
  createUser: (userData: CreateUserDto) => Promise<void>;
  updateUser: (id: number, userData: UpdateUserDto) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  setSelectedUser: (user: User | null) => void;
  clearError: () => void;
  setCurrentQuery: (query: QueryUsersDto) => void;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  // Estado inicial
  users: [],
  selectedUser: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  currentQuery: {
    page: 1,
    limit: 10,
  },

  // Obtener lista de usuarios
  fetchUsers: async (query?: QueryUsersDto) => {
    try {
      set({ loading: true, error: null });
      
      const finalQuery = { ...get().currentQuery, ...query };
      const response: PaginatedResponse<User> = await usersService.getUsers(finalQuery);
      
      set({
        users: response.data,
        pagination: response.pagination,
        currentQuery: finalQuery,
        loading: false,
      });
    } catch (error: any) {
      set({ 
        loading: false, 
        error: error.response?.data?.message || 'Error al cargar usuarios' 
      });
    }
  },

  // Obtener usuario por ID
  fetchUserById: async (id: number) => {
    try {
      set({ loading: true, error: null });
      
      const user = await usersService.getUserById(id);
      
      set({
        selectedUser: user,
        loading: false,
      });
    } catch (error: any) {
      set({ 
        loading: false, 
        error: error.response?.data?.message || 'Error al cargar usuario' 
      });
    }
  },

  // Crear usuario
  createUser: async (userData: CreateUserDto) => {
    try {
      set({ loading: true, error: null });
      
      const newUser = await usersService.createUser(userData);
      
      // Refrescar la lista después de crear
      const { fetchUsers, currentQuery } = get();
      await fetchUsers(currentQuery);
      
      set({ loading: false });
    } catch (error: any) {
      set({ 
        loading: false, 
        error: error.response?.data?.message || 'Error al crear usuario' 
      });
      throw error; // Re-throw para que el componente pueda manejarlo
    }
  },

  // Actualizar usuario
  updateUser: async (id: number, userData: UpdateUserDto) => {
    try {
      set({ loading: true, error: null });
      
      const updatedUser = await usersService.updateUser(id, userData);
      
      // Actualizar la lista local
      set((state) => ({
        users: state.users.map(user => 
          user.id === id ? updatedUser : user
        ),
        selectedUser: state.selectedUser?.id === id ? updatedUser : state.selectedUser,
        loading: false,
      }));
    } catch (error: any) {
      set({ 
        loading: false, 
        error: error.response?.data?.message || 'Error al actualizar usuario' 
      });
      throw error;
    }
  },

  // Eliminar usuario (soft delete)
  deleteUser: async (id: number) => {
    try {
      set({ loading: true, error: null });
      
      await usersService.deleteUser(id);
      
      // Remover de la lista local
      set((state) => ({
        users: state.users.filter(user => user.id !== id),
        selectedUser: state.selectedUser?.id === id ? null : state.selectedUser,
        loading: false,
      }));
    } catch (error: any) {
      set({ 
        loading: false, 
        error: error.response?.data?.message || 'Error al eliminar usuario' 
      });
      throw error;
    }
  },

  // Acciones de utilidad
  setSelectedUser: (user: User | null) => {
    set({ selectedUser: user });
  },

  clearError: () => {
    set({ error: null });
  },

  setCurrentQuery: (query: QueryUsersDto) => {
    set({ currentQuery: { ...get().currentQuery, ...query } });
  },
}));
