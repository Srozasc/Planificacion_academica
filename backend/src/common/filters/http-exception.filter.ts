import { 
  ExceptionFilter, 
  Catch, 
  ArgumentsHost, 
  HttpException, 
  HttpStatus,
  Inject 
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ILogger, ApiResponse } from '../interfaces';

/**
 * GlobalExceptionFilter - Filtro global para manejo de excepciones
 * 
 * Intercepta todas las excepciones y las transforma en respuestas
 * consistentes siguiendo el formato ApiResponse
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(@Inject('LOGGER') private readonly logger: ILogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let errors: string[] = [];

    // Determinar el tipo de excepción y extraer información
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        
        // Si hay errores de validación, los extraemos
        if (Array.isArray(responseObj.message)) {
          errors = responseObj.message;
          message = 'Validation failed';
        } else if (responseObj.errors && Array.isArray(responseObj.errors)) {
          errors = responseObj.errors;
        }
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message || 'Internal server error';
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Unknown error occurred';
    }

    // Log del error
    this.logger.error(
      `Exception: ${message} - ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : undefined,
      'ExceptionFilter'
    );

    // Crear respuesta estándar
    const errorResponse: ApiResponse = {
      success: false,
      message,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    };

    // Log estructurado para análisis
    if (this.logger['logStructured']) {
      this.logger['logStructured']('EXCEPTION', 'Unhandled exception', {
        statusCode: status,
        method: request.method,
        url: request.url,
        ip: request.ip,
        userAgent: request.get('User-Agent'),
        message,
        errors,
      });
    }

    response.status(status).json(errorResponse);
  }
}
