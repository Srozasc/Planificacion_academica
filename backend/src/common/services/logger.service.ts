import { Injectable, LoggerService } from '@nestjs/common';
import { ILogger } from '../interfaces';

/**
 * AppLoggerService - Servicio de logging personalizado
 * 
 * Implementa la interfaz ILogger y LoggerService de NestJS
 * Puede ser fácilmente extendido para usar Winston, Pino, u otros loggers
 */
@Injectable()
export class AppLoggerService implements ILogger, LoggerService {
  private context = 'AppLogger';

  /**
   * Log de información general
   */
  log(message: string, context?: string): void {
    const timestamp = new Date().toISOString();
    const logContext = context || this.context;
    console.log(`[${timestamp}] [LOG] [${logContext}] ${message}`);
  }

  /**
   * Log de errores
   */
  error(message: string, trace?: string, context?: string): void {
    const timestamp = new Date().toISOString();
    const logContext = context || this.context;
    console.error(`[${timestamp}] [ERROR] [${logContext}] ${message}`);
    
    if (trace) {
      console.error(`[${timestamp}] [TRACE] [${logContext}] ${trace}`);
    }
  }

  /**
   * Log de advertencias
   */
  warn(message: string, context?: string): void {
    const timestamp = new Date().toISOString();
    const logContext = context || this.context;
    console.warn(`[${timestamp}] [WARN] [${logContext}] ${message}`);
  }

  /**
   * Log de debug (solo en desarrollo)
   */
  debug(message: string, context?: string): void {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      const logContext = context || this.context;
      console.debug(`[${timestamp}] [DEBUG] [${logContext}] ${message}`);
    }
  }

  /**
   * Log de información detallada (verbose)
   */
  verbose(message: string, context?: string): void {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      const logContext = context || this.context;
      console.log(`[${timestamp}] [VERBOSE] [${logContext}] ${message}`);
    }
  }

  /**
   * Configurar contexto por defecto
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * Log estructurado para análisis
   */
  logStructured(level: string, message: string, metadata?: any, context?: string): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      context: context || this.context,
      message,
      metadata: metadata || {},
      environment: process.env.NODE_ENV || 'development',
    };

    console.log(JSON.stringify(logEntry));
  }

  /**
   * Log de operaciones de base de datos
   */
  logDatabase(operation: string, query: string, duration?: number, context?: string): void {
    const metadata = {
      operation,
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      duration: duration ? `${duration}ms` : undefined,
    };

    this.logStructured('DATABASE', `${operation} executed`, metadata, context || 'DatabaseService');
  }

  /**
   * Log de autenticación
   */
  logAuth(event: string, userId?: number, email?: string, context?: string): void {
    const metadata = {
      event,
      userId,
      email: email ? this.maskEmail(email) : undefined,
    };

    this.logStructured('AUTH', `Authentication event: ${event}`, metadata, context || 'AuthService');
  }

  /**
   * Log de uploads
   */
  logUpload(filename: string, size: number, type: string, context?: string): void {
    const metadata = {
      filename,
      size: `${(size / 1024 / 1024).toFixed(2)}MB`,
      type,
    };

    this.logStructured('UPLOAD', `File uploaded: ${filename}`, metadata, context || 'UploadService');
  }

  /**
   * Enmascarar email para logs (seguridad)
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2 
      ? local.substring(0, 2) + '*'.repeat(local.length - 2)
      : local;
    return `${maskedLocal}@${domain}`;
  }
}
