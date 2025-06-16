import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, LoginRequest, UserProfile } from '../services/auth.service';

export interface AuthState {
  // Estado
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  permissions: string[];
  token: string | null;
  
  // Acciones
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  clearAuth: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      isAuthenticated: false,
      isLoading: false,
      user: null,
      permissions: [],
      token: null,      // Login
      login: async (credentials: LoginRequest) => {
        try {
          set({ isLoading: true });
          
          const response = await authService.login(credentials);
          
          set({
            isAuthenticated: true,
            user: response.user,
            permissions: response.permissions,
            token: response.access_token,
            isLoading: false,
          });
        } catch (error) {
          set({
            isAuthenticated: false,
            user: null,
            permissions: [],
            token: null,
            isLoading: false,
          });
          throw error;
        }
      },

      // Logout
      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Error durante logout:', error);
        } finally {
          set({
            isAuthenticated: false,
            user: null,
            permissions: [],
            token: null,
            isLoading: false,
          });
        }
      },

      // Cargar sesión existente (al iniciar la app)
      loadSession: async () => {
        try {
          set({ isLoading: true });
          
          const token = authService.getToken();
          if (!token) {
            set({ isLoading: false });
            return;
          }

          const validation = await authService.validateToken();
          
          if (validation.valid && validation.user && validation.permissions) {
            set({
              isAuthenticated: true,
              user: validation.user,
              permissions: validation.permissions,
              token,
              isLoading: false,
            });
          } else {
            // Token inválido, limpiar estado
            authService.removeToken();
            set({
              isAuthenticated: false,
              user: null,
              permissions: [],
              token: null,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Error cargando sesión:', error);
          authService.removeToken();
          set({
            isAuthenticated: false,
            user: null,
            permissions: [],
            token: null,
            isLoading: false,
          });
        }
      },

      // Limpiar autenticación
      clearAuth: () => {
        authService.removeToken();
        set({
          isAuthenticated: false,
          user: null,
          permissions: [],
          token: null,
          isLoading: false,
        });
      },

      // Verificar si el usuario tiene un permiso específico
      hasPermission: (permission: string) => {
        const { permissions } = get();
        return permissions.includes(permission);
      },

      // Verificar si el usuario tiene alguno de los permisos especificados
      hasAnyPermission: (permissionList: string[]) => {
        const { permissions } = get();
        return permissionList.some(permission => permissions.includes(permission));
      },
    }),    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        permissions: state.permissions,
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        // Asegurar que no hay un estado inconsistente al recargar
        if (state && !state.token) {
          state.isAuthenticated = false;
          state.user = null;
          state.permissions = [];
        }
      },
    }
  )
);
