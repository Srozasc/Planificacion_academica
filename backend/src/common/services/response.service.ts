import { Injectable } from '@nestjs/common';
import { 
  ApiResponse, 
  PaginatedResponse, 
  PaginationOptions 
} from '../interfaces';

/**
 * ResponseService - Servicio para estandarizar respuestas de API
 * 
 * Proporciona métodos para crear respuestas consistentes en toda la aplicación
 */
@Injectable()
export class ResponseService {
  
  /**
   * Crear respuesta exitosa
   */
  success<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message: message || 'Operation completed successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Crear respuesta de error
   */
  error(message: string, errors?: string[]): ApiResponse {
    return {
      success: false,
      message,
      errors: errors || [],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Crear respuesta paginada
   */
  paginated<T>(
    data: T[],
    total: number,
    options: PaginationOptions,
    message?: string
  ): PaginatedResponse<T> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data,
      message: message || 'Data retrieved successfully',
      timestamp: new Date().toISOString(),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Crear respuesta para operación de creación
   */
  created<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message: message || 'Resource created successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Crear respuesta para operación de actualización
   */
  updated<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message: message || 'Resource updated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Crear respuesta para operación de eliminación
   */
  deleted(message?: string): ApiResponse {
    return {
      success: true,
      message: message || 'Resource deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Crear respuesta sin contenido (204)
   */
  noContent(): ApiResponse {
    return {
      success: true,
      message: 'No content',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Crear respuesta para validación fallida
   */
  validationError(errors: string[]): ApiResponse {
    return {
      success: false,
      message: 'Validation failed',
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Crear respuesta para recurso no encontrado
   */
  notFound(resource?: string): ApiResponse {
    return {
      success: false,
      message: resource ? `${resource} not found` : 'Resource not found',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Crear respuesta para acceso no autorizado
   */
  unauthorized(message?: string): ApiResponse {
    return {
      success: false,
      message: message || 'Unauthorized access',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Crear respuesta para acceso prohibido
   */
  forbidden(message?: string): ApiResponse {
    return {
      success: false,
      message: message || 'Access forbidden',
      timestamp: new Date().toISOString(),
    };
  }
}
