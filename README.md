# Frontend - Sistema de Planificación Académica

## 📋 Descripción

Aplicación frontend desarrollada con **React** y **TypeScript** que proporciona una interfaz moderna y responsiva para el Sistema de Planificación Académica de DUOC UC.

## 🏗️ Arquitectura

### Patrón de Diseño
- **Feature-based Architecture** - Organización por características
- **Component-driven Development** - Componentes reutilizables
- **Atomic Design** - Jerarquía de componentes
- **Separation of Concerns** - Separación clara de responsabilidades

### Estructura del Proyecto

```
src/
├── components/             # Componentes reutilizables
│   ├── layout/            # Componentes de layout
│   ├── ui/                # Componentes UI básicos
│   ├── forms/             # Componentes de formularios
│   ├── tables/            # Componentes de tablas
│   └── modals/            # Componentes modales
├── features/              # Características específicas
│   ├── auth/              # Autenticación
│   ├── dashboard/         # Dashboard principal
│   ├── users/             # Gestión de usuarios
│   ├── bimestres/         # Períodos académicos
│   ├── scheduling/        # Programación académica
│   ├── uploads/           # Carga de archivos
│   └── reports/           # Reportes
├── pages/                 # Páginas principales
├── services/              # Servicios de API
├── store/                 # Gestión de estado global
├── hooks/                 # Custom hooks
├── types/                 # Definiciones TypeScript
├── utils/                 # Utilidades y helpers
├── styles/                # Estilos globales
└── assets/                # Recursos estáticos
```

## 🛠️ Tecnologías Utilizadas

### Core
- **React 18+** - Biblioteca de UI
- **TypeScript 5+** - Lenguaje de programación
- **Vite 5+** - Build tool y dev server

### Routing y Estado
- **React Router 6+** - Enrutamiento SPA
- **Zustand 4+** - Gestión de estado ligera
- **React Query** - Gestión de estado del servidor

### UI y Estilos
- **Tailwind CSS 3+** - Framework de CSS utility-first
- **Headless UI** - Componentes accesibles
- **Heroicons** - Iconografía
- **React Hook Form** - Manejo de formularios

### Utilidades
- **Axios** - Cliente HTTP
- **date-fns** - Manipulación de fechas
- **React Hot Toast** - Notificaciones
- **FullCalendar** - Componente de calendario

### Testing
- **Vitest** - Framework de testing
- **React Testing Library** - Testing de componentes
- **Cypress** - Testing E2E
- **MSW** - Mock Service Worker

## 🚀 Instalación y Configuración

### Prerrequisitos
```bash
Node.js 18+
npm 9+
```

### Instalación
```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
```

### Variables de Entorno (.env)
```env
# API Configuration
VITE_API_URL=http://localhost:3001/api
VITE_API_TIMEOUT=10000

# App Configuration
VITE_APP_NAME=Sistema de Planificación Académica
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Sistema integral de planificación académica

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true

# Upload Configuration
VITE_MAX_FILE_SIZE=10485760
VITE_ALLOWED_FILE_TYPES=.xlsx,.xls,.csv
```

## 🏃‍♂️ Ejecución

### Desarrollo
```bash
npm run dev
```

### Build para Producción
```bash
npm run build
```

### Preview de Producción
```bash
npm run preview
```

### Linting y Formateo
```bash
npm run lint
npm run lint:fix
npm run format
```

## 🧪 Pruebas

### Ejecutar Pruebas
```bash
# Pruebas unitarias
npm run test

# Pruebas en modo watch
npm run test:watch

# Pruebas con cobertura
npm run test:coverage

# Pruebas E2E
npm run test:e2e

# Abrir Cypress
npm run cypress:open
```
## 🎨 Sistema de Diseño

### Paleta de Colores
```css
:root {
  /* Primary Colors */
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;

  /* Secondary Colors */
  --color-secondary-50: #f8fafc;
  --color-secondary-500: #64748b;
  --color-secondary-600: #475569;

  /* Success, Warning, Error */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
}
```

### Tipografía
```css
/* Font Families */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Font Sizes */
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
```

### Espaciado
```css
/* Spacing Scale */
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-4: 1rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-12: 3rem;
```

## 🧩 Componentes Principales

### Layout Components
```typescript
// MainLayout.tsx
interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  showSidebar?: boolean;
}

// Sidebar.tsx
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: NavigationItem[];
}

// Header.tsx
interface HeaderProps {
  user: User;
  onLogout: () => void;
  onToggleSidebar: () => void;
}
```

### UI Components
```typescript
// Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

// Input.tsx
interface InputProps {
  type: 'text' | 'email' | 'password' | 'number';
  label?: string;
  error?: string;
  placeholder?: string;
  required?: boolean;
}

// Modal.tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
```

### Feature Components
```typescript
// Calendar.tsx
interface CalendarProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateSelect: (date: Date) => void;
  view: 'month' | 'week' | 'day';
}

// DataTable.tsx
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pagination?: PaginationConfig;
  sorting?: SortingConfig;
  filtering?: FilteringConfig;
}

// FileUpload.tsx
interface FileUploadProps {
  accept: string;
  maxSize: number;
  multiple?: boolean;
  onUpload: (files: File[]) => void;
  onError: (error: string) => void;
}
```

## 🔄 Gestión de Estado

### Zustand Stores
```typescript
// authStore.ts
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// bimestresStore.ts
interface BimestresState {
  bimestres: Bimestre[];
  activeBimestre: Bimestre | null;
  loading: boolean;
  error: string | null;
  fetchBimestres: () => Promise<void>;
  setActiveBimestre: (id: string) => void;
  createBimestre: (data: CreateBimestreData) => Promise<void>;
}

// schedulingStore.ts
interface SchedulingState {
  events: ScheduleEvent[];
  selectedEvent: ScheduleEvent | null;
  filters: EventFilters;
  loading: boolean;
  fetchEvents: (filters?: EventFilters) => Promise<void>;
  createEvent: (data: CreateEventData) => Promise<void>;
  updateEvent: (id: string, data: UpdateEventData) => Promise<void>;
}
```

### React Query Integration
```typescript
// useEvents.ts
export const useEvents = (filters?: EventFilters) => {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => eventsService.getEvents(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// useCreateEvent.ts
export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: eventsService.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      toast.success('Evento creado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al crear evento');
    },
  });
};
```

## 🌐 Servicios de API

### Base Service
```typescript
// apiService.ts
class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use((config) => {
      const token = authStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          authStore.getState().logout();
        }
        return Promise.reject(error);
      }
    );
  }
}
```

### Feature Services
```typescript
// authService.ts
export const authService = {
  login: (credentials: LoginCredentials) =>
    apiService.post('/auth/login', credentials),
  
  logout: () =>
    apiService.post('/auth/logout'),
  
  refreshToken: () =>
    apiService.post('/auth/refresh'),
  
  getProfile: () =>
    apiService.get('/auth/profile'),
};

// eventsService.ts
export const eventsService = {
  getEvents: (filters?: EventFilters) =>
    apiService.get('/scheduling/events', { params: filters }),
  
  createEvent: (data: CreateEventData) =>
    apiService.post('/scheduling/events', data),
  
  updateEvent: (id: string, data: UpdateEventData) =>
    apiService.put(`/scheduling/events/${id}`, data),
  
  deleteEvent: (id: string) =>
    apiService.delete(`/scheduling/events/${id}`),
};
```

## 🎣 Custom Hooks

### Utility Hooks
```typescript
// useLocalStorage.ts
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
};

// useDebounce.ts
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
```

### Business Logic Hooks
```typescript
// useAuth.ts
export const useAuth = () => {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  
  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      await login(credentials);
      toast.success('Inicio de sesión exitoso');
    } catch (error) {
      toast.error('Error al iniciar sesión');
      throw error;
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
  };

  return {
    user,
    isAuthenticated,
    login: handleLogin,
    logout: handleLogout,
  };
};

// usePermissions.ts
export const usePermissions = () => {
  const { user } = useAuth();
  
  const hasPermission = (permission: string) => {
    return user?.permissions?.includes(permission) ?? false;
  };

  const hasRole = (role: string) => {
    return user?.role === role;
  };

  const canAccess = (requiredPermissions: string[]) => {
    return requiredPermissions.every(hasPermission);
  };

  return {
    hasPermission,
    hasRole,
    canAccess,
  };
};
```

## 📱 Responsive Design

### Breakpoints
```css
/* Tailwind CSS Breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X Extra large devices */
```

### Mobile-First Approach
```tsx
// Responsive Component Example
const ResponsiveGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Grid items */}
  </div>
);

// Responsive Navigation
const Navigation = () => (
  <nav className="hidden md:flex md:space-x-8">
    {/* Desktop navigation */}
  </nav>
);
```

## 🔒 Seguridad

### Route Protection
```tsx
// ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requiredRole,
}) => {
  const { isAuthenticated } = useAuth();
  const { canAccess, hasRole } = usePermissions();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredPermissions.length > 0 && !canAccess(requiredPermissions)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

### Input Sanitization
```typescript
// sanitize.ts
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .trim()
    .substring(0, 1000); // Limit length
};

// Form validation with Zod
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
});
```

## 🚀 Performance

### Optimizaciones Implementadas
- **Code Splitting** con React.lazy()
- **Memoización** con React.memo() y useMemo()
- **Virtual Scrolling** para listas grandes
- **Image Optimization** con lazy loading
- **Bundle Analysis** con Vite Bundle Analyzer

### Lazy Loading
```tsx
// Lazy loading de páginas
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Users = lazy(() => import('../pages/Users'));
const Scheduling = lazy(() => import('../pages/Scheduling'));

// Suspense wrapper
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/users" element={<Users />} />
    <Route path="/scheduling" element={<Scheduling />} />
  </Routes>
</Suspense>
```

### Memoización
```tsx
// Memoized component
const ExpensiveComponent = React.memo(({ data, onUpdate }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      computed: heavyComputation(item)
    }));
  }, [data]);

  return (
    <div>
      {processedData.map(item => (
        <Item key={item.id} data={item} onUpdate={onUpdate} />
      ))}
    </div>
  );
});
```

## 🐳 Docker

### Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration
```nginx
server {
  listen 80;
  server_name localhost;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://backend:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

## 📊 Análisis y Métricas

### Bundle Analysis
```bash
# Analizar bundle
npm run build:analyze

# Lighthouse CI
npm run lighthouse
```

### Performance Metrics
- **First Contentful Paint**: <1.5s
- **Largest Contentful Paint**: <2.5s
- **Cumulative Layout Shift**: <0.1
- **Time to Interactive**: <3s

## 🤝 Contribución

### Estándares de Código
```json
// .eslintrc.js
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "react/prop-types": "off",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error"
  }
}
```

### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{css,scss}": ["prettier --write"]
  }
}
```

## 📄 Licencia

Este proyecto es propiedad de **DUOC UC**.

---

**Desarrollado con ❤️ por el equipo de desarrollo**  
DUOC UC - 2025