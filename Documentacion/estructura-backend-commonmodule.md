# Estructura de Archivos del Backend - CommonModule

## Descripción General

El backend ha sido refactorizado para implementar una arquitectura basada en un **CommonModule** que proporciona recursos compartidos, garantizando que cada módulo de funcionalidad esté completamente desacoplado y solo importe lo que necesita del módulo común.

## Estructura de Archivos

```
backend/
├── src/
│   ├── common/                           # Módulo común global
│   │   ├── common.module.ts              # Definición del módulo global
│   │   ├── index.ts                      # Exportaciones principales
│   │   ├── interfaces/                   # Interfaces compartidas
│   │   │   └── index.ts                  # Interfaces base para servicios
│   │   ├── services/                     # Servicios compartidos
│   │   │   ├── database.service.ts       # Servicio unificado de base de datos
│   │   │   ├── response.service.ts       # Servicio de respuestas estandarizadas
│   │   │   ├── logger.service.ts         # Servicio de logging estructurado
│   │   │   └── index.ts                  # Exportaciones de servicios
│   │   ├── guards/                       # Guards de autenticación y autorización
│   │   │   ├── jwt-auth.guard.ts         # Guard JWT para autenticación
│   │   │   ├── roles.guard.ts            # Guard para control de roles
│   │   │   └── index.ts                  # Exportaciones de guards
│   │   ├── decorators/                   # Decoradores compartidos
│   │   │   ├── roles.decorator.ts        # Decorador para especificar roles
│   │   │   └── index.ts                  # Exportaciones de decoradores
│   │   ├── entities/                     # Entidades compartidas
│   │   │   ├── role.entity.ts            # Entidad Role (compartida)
│   │   │   └── index.ts                  # Exportaciones de entidades
│   │   ├── interceptors/                 # Interceptores globales
│   │   │   ├── logging.interceptor.ts    # Interceptor de logging
│   │   │   └── response-transform.interceptor.ts # Interceptor de transformación
│   │   └── filters/                      # Filtros de excepción globales
│   │       └── http-exception.filter.ts  # Filtro global de excepciones
│   │
│   ├── auth/                             # Módulo de autenticación
│   │   ├── auth.module.ts                # Configuración del módulo
│   │   ├── auth.controller.ts            # Controlador de autenticación
│   │   ├── auth.service.ts               # Lógica de negocio de auth
│   │   ├── strategies/                   # Estrategias de autenticación
│   │   └── entities/                     # Entidades específicas del módulo
│   │
│   ├── users/                            # Módulo de usuarios
│   │   ├── users.module.ts               # Configuración del módulo
│   │   ├── users.controller.ts           # Controlador de usuarios
│   │   ├── users.service.ts              # Lógica de negocio de usuarios
│   │   ├── dto/                          # DTOs específicos del módulo
│   │   └── entities/                     # Entidades específicas del módulo
│   │
│   ├── scheduling/                       # Módulo de programación académica
│   │   ├── scheduling.module.ts          # Configuración del módulo
│   │   ├── scheduling.controller.ts      # Controlador de programación
│   │   ├── scheduling.service.ts         # Lógica de negocio refactorizada
│   │   ├── scheduling.gateway.ts         # Gateway WebSocket
│   │   ├── dto/                          # DTOs específicos del módulo
│   │   └── entities/                     # Entidades específicas del módulo
│   │
│   ├── uploads/                          # Módulo de carga de archivos
│   ├── teachers/                         # Módulo de profesores
│   ├── academic/                         # Módulo académico
│   ├── payment-codes/                    # Módulo de códigos de pago
│   ├── course-reports/                   # Módulo de reportes de cursos
│   ├── reports/                          # Módulo de reportes
│   ├── approval/                         # Módulo de aprobaciones
│   │
│   ├── app.module.ts                     # Módulo principal de la aplicación
│   └── main.ts                           # Punto de entrada de la aplicación
│
├── REFACTORING_SUMMARY.md                # Resumen técnico del refactoring
└── package.json                          # Dependencias del proyecto
```

## Componentes Comunes Detallados

### 📁 `/src/common/`

Este directorio contiene todos los recursos compartidos que son utilizados por múltiples módulos de la aplicación.

#### 🔧 **Servicios Compartidos** (`/services/`)

##### `database.service.ts`
**Propósito**: Servicio unificado para operaciones de base de datos
- **Funcionalidades**:
  - Ejecución de consultas SQL directas
  - Ejecución de stored procedures con manejo de respuestas estandarizadas
  - Manejo de transacciones
  - Logging automático de consultas
  - Pool de conexiones MySQL2 optimizado
- **Usado por**: Todos los módulos que necesiten acceso a base de datos
- **Métodos principales**:
  - `query(sql, params)`: Ejecuta consultas SQL
  - `executeStoredProcedure(name, params)`: Ejecuta stored procedures
  - `transaction(callback)`: Maneja transacciones
  - `healthCheck()`: Verifica conectividad

##### `response.service.ts`
**Propósito**: Estandarización de respuestas API
- **Funcionalidades**:
  - Formato consistente de respuestas exitosas
  - Manejo estandarizado de errores
  - Paginación uniforme
  - Metadata de respuestas
- **Usado por**: Todos los controladores
- **Métodos principales**:
  - `success(data, message)`: Respuesta exitosa
  - `error(message, code)`: Respuesta de error
  - `paginated(data, pagination)`: Respuesta paginada

##### `logger.service.ts`
**Propósito**: Sistema de logging estructurado
- **Funcionalidades**:
  - Logging con niveles (debug, info, warn, error)
  - Contexto automático por módulo
  - Formateo estructurado para análisis
  - Rotación de logs automática
- **Usado por**: Todos los servicios y controladores
- **Métodos principales**:
  - `debug(message, context)`: Logs de depuración
  - `info(message, context)`: Información general
  - `warn(message, context)`: Advertencias
  - `error(message, stack, context)`: Errores

#### 🛡️ **Guards** (`/guards/`)

##### `jwt-auth.guard.ts`
**Propósito**: Autenticación basada en JWT
- **Funcionalidades**:
  - Validación de tokens JWT
  - Extracción de información del usuario
  - Manejo de tokens expirados
  - Protección de rutas
- **Usado por**: Controladores que requieren autenticación
- **Aplicación**: `@UseGuards(JwtAuthGuard)`

##### `roles.guard.ts`
**Propósito**: Control de acceso basado en roles
- **Funcionalidades**:
  - Verificación de roles de usuario
  - Control granular de permisos
  - Integración con decorador @Roles
- **Usado por**: Controladores que requieren autorización específica
- **Aplicación**: `@UseGuards(JwtAuthGuard, RolesGuard)`

#### 🏷️ **Decoradores** (`/decorators/`)

##### `roles.decorator.ts`
**Propósito**: Especificación de roles requeridos
- **Funcionalidades**:
  - Definición de roles necesarios para acceder a endpoints
  - Integración con RolesGuard
  - Soporte para múltiples roles
- **Usado por**: Métodos de controladores
- **Aplicación**: `@Roles('admin', 'user')`

#### 🗃️ **Entidades Compartidas** (`/entities/`)

##### `role.entity.ts`
**Propósito**: Entidad de roles del sistema
- **Funcionalidades**:
  - Definición de roles de usuario
  - Relaciones con otras entidades
  - Campos de auditoría (created_at, updated_at)
- **Usado por**: Módulos `auth` y `users`
- **Campos**:
  - `id`: Identificador único
  - `name`: Nombre del rol
  - `description`: Descripción del rol
  - `is_active`: Estado del rol

#### 🔄 **Interceptores** (`/interceptors/`)

##### `logging.interceptor.ts`
**Propósito**: Logging automático de requests/responses
- **Funcionalidades**:
  - Log automático de todas las peticiones
  - Medición de tiempo de respuesta
  - Captura de errores
  - Información contextual

##### `response-transform.interceptor.ts`
**Propósito**: Transformación consistente de respuestas
- **Funcionalidades**:
  - Formato uniforme de respuestas
  - Adición de metadata
  - Limpieza de datos sensibles

#### 🚨 **Filtros** (`/filters/`)

##### `http-exception.filter.ts`
**Propósito**: Manejo global de excepciones
- **Funcionalidades**:
  - Captura de errores no manejados
  - Formateo consistente de errores
  - Logging automático de excepciones
  - Ocultación de información sensible

#### 📋 **Interfaces** (`/interfaces/`)

Contiene interfaces TypeScript que definen contratos para servicios y respuestas:
- `ILogger`: Interface para servicios de logging
- `IDatabaseService`: Interface para servicios de base de datos
- `ApiResponse`: Interface para respuestas API estandarizadas
- `StoredProcedureResponse`: Interface para respuestas de stored procedures

## Beneficios de esta Arquitectura

### ✅ **Desacoplamiento**
- Los módulos de funcionalidad no dependen directamente entre sí
- Cada módulo solo importa del CommonModule
- Facilita el testing y mantenimiento

### ✅ **Reutilización**
- Servicios compartidos evitan duplicación de código
- Guards y decoradores consistentes en toda la aplicación
- Patrones estandarizados de logging y manejo de errores

### ✅ **Escalabilidad**
- Fácil adición de nuevos módulos de funcionalidad
- Configuración centralizada de recursos compartidos
- Gestión eficiente de conexiones de base de datos

### ✅ **Mantenibilidad**
- Cambios en servicios compartidos se propagan automáticamente
- Código más limpio y organizado
- Debugging simplificado con logging estructurado

## Uso en Nuevos Módulos

Para crear un nuevo módulo que aproveche esta arquitectura:

```typescript
// nuevo-modulo.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([TuEntidad]),
    // CommonModule ya está disponible globalmente
  ],
  controllers: [TuController],
  providers: [TuService],
})
export class NuevoModuloModule {}

// tu-service.ts
@Injectable()
export class TuService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly responseService: ResponseService,
    @Inject('LOGGER') private readonly logger: ILogger,
  ) {}
}

// tu-controller.ts
@Controller('tu-ruta')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class TuController {
  // Tu implementación
}
```

Esta arquitectura garantiza consistencia, mantenibilidad y escalabilidad en todo el proyecto.
