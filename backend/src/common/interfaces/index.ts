/**
 * Interfaces base para servicios compartidos
 */

// Interface para respuestas estándar de la API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: string;
}

// Interface para paginación
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Interface para logging
export interface ILogger {
  log(message: string, context?: string): void;
  error(message: string, trace?: string, context?: string): void;
  warn(message: string, context?: string): void;
  debug(message: string, context?: string): void;
}

// Interface para base de datos
export interface IDatabaseService {
  query(sql: string, params?: any[]): Promise<any>;
  execute(sql: string, params?: any[]): Promise<any>;
  transaction<T>(callback: (connection: any) => Promise<T>): Promise<T>;
}

// Interface para configuración de aplicación
export interface IAppConfig {
  port: number;
  environment: string;
  jwtSecret: string;
  uploadMaxSize: number;
  corsOrigins: string[];
}

// Interface base para entidades
export interface BaseEntity {
  id: number;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

// Interface para stored procedures response
export interface StoredProcedureResponse<T = any> {
  status_code: string;
  message: string;
  data?: T;
  affected_rows?: number;
  error_message?: string;
}

// Interface para validación de archivos
export interface FileValidationOptions {
  allowedTypes: string[];
  maxSize: number;
  required: boolean;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  file?: Express.Multer.File;
}

// Tipos de usuario y roles
export enum UserRole {
  VISUALIZADOR = 'Visualizador',
  EDITOR = 'Editor',
  MAESTRO = 'Maestro'
}

// Estados generales
export enum EntityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  DELETED = 'deleted'
}

// Tipos para módulos específicos
export enum ModuleType {
  AUTH = 'auth',
  USERS = 'users',
  UPLOADS = 'uploads',
  SCHEDULING = 'scheduling',
  ACADEMIC = 'academic',
  TEACHERS = 'teachers',
  PAYMENT_CODES = 'payment_codes',
  COURSE_REPORTS = 'course_reports',
  REPORTS = 'reports',
  APPROVAL = 'approval'
}
