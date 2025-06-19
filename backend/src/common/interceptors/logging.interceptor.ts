import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ILogger } from '../interfaces';

/**
 * LoggingInterceptor - Interceptor global para logging automático
 * 
 * Registra automáticamente:
 * - Tiempo de ejecución de requests
 * - Información de la petición (método, URL, IP)
 * - Código de respuesta
 * - Errores si ocurren
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(@Inject('LOGGER') private readonly logger: ILogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, ip } = request;
    const userAgent = request.get('User-Agent') || '';
    const startTime = Date.now();

    // Log de entrada
    this.logger.debug(
      `Incoming ${method} ${url} from ${ip}`,
      'HTTP'
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const { statusCode } = response;

          // Log de salida exitosa
          this.logger.log(
            `${method} ${url} ${statusCode} - ${duration}ms`,
            'HTTP'
          );

          // Log estructurado para análisis
          if (this.logger['logStructured']) {
            this.logger['logStructured']('HTTP', 'Request completed', {
              method,
              url,
              statusCode,
              duration: `${duration}ms`,
              ip,
              userAgent: userAgent.substring(0, 50),
              responseSize: JSON.stringify(data).length,
            });
          }
        },
        error: (error) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const { statusCode } = response;

          // Log de error
          this.logger.error(
            `${method} ${url} ${statusCode || 500} - ${duration}ms - Error: ${error.message}`,
            error.stack,
            'HTTP'
          );

          // Log estructurado para análisis de errores
          if (this.logger['logStructured']) {
            this.logger['logStructured']('ERROR', 'Request failed', {
              method,
              url,
              statusCode: statusCode || 500,
              duration: `${duration}ms`,
              ip,
              error: error.message,
              userAgent: userAgent.substring(0, 50),
            });
          }
        },
      }),
    );
  }
}
