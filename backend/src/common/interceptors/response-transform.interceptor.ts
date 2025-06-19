import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces';

/**
 * ResponseTransformInterceptor - Interceptor para transformar respuestas
 * 
 * Asegura que todas las respuestas sigan el formato ApiResponse estándar
 * Si la respuesta ya está en el formato correcto, la deja pasar
 * Si no, la envuelve en el formato estándar
 */
@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Si la respuesta ya tiene el formato ApiResponse, la devolvemos tal como está
        if (data && typeof data === 'object' && 'success' in data && 'timestamp' in data) {
          return data;
        }

        // Si es null o undefined, devolvemos respuesta vacía
        if (data === null || data === undefined) {
          return {
            success: true,
            data: null,
            message: 'Operation completed successfully',
            timestamp: new Date().toISOString(),
          } as ApiResponse;
        }

        // Para cualquier otro tipo de datos, los envolvemos en ApiResponse
        return {
          success: true,
          data,
          message: 'Operation completed successfully',
          timestamp: new Date().toISOString(),
        } as ApiResponse;
      }),
    );
  }
}
