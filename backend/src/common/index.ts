// Módulo principal
export { CommonModule } from './common.module';

// Interfaces
export * from './interfaces';

// Entidades compartidas
export { Role } from './entities';

// Servicios
export { DatabaseService } from './services/database.service';
export { ResponseService } from './services/response.service';
export { AppLoggerService } from './services/logger.service';

// Guards y decorators
export { JwtAuthGuard, RolesGuard } from './guards';
export { Roles } from './decorators';

// Interceptors
export { LoggingInterceptor } from './interceptors/logging.interceptor';
export { ResponseTransformInterceptor } from './interceptors/response-transform.interceptor';

// Filters
export { GlobalExceptionFilter } from './filters/http-exception.filter';

// Re-export de servicios para fácil acceso
export * from './services';
