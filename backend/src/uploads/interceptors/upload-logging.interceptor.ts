import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { UploadConfig } from '../config/upload.config';

@Injectable()
export class UploadLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(UploadLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!UploadConfig.logging.logUploads) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    const {
      method,
      url,
      ip,
      headers: { 'user-agent': userAgent }
    } = request;
    
    const file = request.file;
    const uploadType = this.extractUploadType(url);
    const startTime = Date.now();

    // Log del inicio del upload
    if (file) {
      this.logger.log(
        `📁 UPLOAD START - ${method} ${url} | ` +
        `Type: ${uploadType} | ` +
        `File: ${file.originalname} (${this.formatFileSize(file.size)}) | ` +
        `MIME: ${file.mimetype} | ` +
        `IP: ${ip}`
      );
    } else {
      this.logger.warn(
        `⚠️  UPLOAD NO FILE - ${method} ${url} | ` +
        `Type: ${uploadType} | ` +
        `IP: ${ip}`
      );
    }

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const success = data?.success !== false;
        
        if (success) {
          this.logger.log(
            `✅ UPLOAD SUCCESS - ${method} ${url} | ` +
            `Type: ${uploadType} | ` +
            `Duration: ${duration}ms | ` +
            `Records: ${data?.totalRecords || 0} | ` +
            `Inserted: ${data?.insertedCount || 0} | ` +
            `Updated: ${data?.updatedCount || 0} | ` +
            `Errors: ${data?.errorCount || 0} | ` +
            `Status: ${response.statusCode}`
          );
        } else {
          this.logger.error(
            `❌ UPLOAD FAILED - ${method} ${url} | ` +
            `Type: ${uploadType} | ` +
            `Duration: ${duration}ms | ` +
            `Error: ${data?.message || 'Unknown error'} | ` +
            `Status: ${response.statusCode}`
          );
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        
        this.logger.error(
          `💥 UPLOAD ERROR - ${method} ${url} | ` +
          `Type: ${uploadType} | ` +
          `Duration: ${duration}ms | ` +
          `Error: ${error.message} | ` +
          `Status: ${response.statusCode || 500}`
        );
        
        // Log detalles adicionales para debugging
        if (UploadConfig.logging.logLevel === 'debug') {
          this.logger.debug('Upload error details:', {
            error: error.message,
            stack: error.stack,
            file: file ? {
              name: file.originalname,
              size: file.size,
              mime: file.mimetype
            } : null,
            request: {
              method,
              url,
              ip,
              userAgent
            }
          });
        }

        throw error;
      })
    );
  }

  private extractUploadType(url: string): string {
    const segments = url.split('/');
    const uploadsIndex = segments.indexOf('uploads');
    
    if (uploadsIndex !== -1 && uploadsIndex < segments.length - 1) {
      return segments[uploadsIndex + 1];
    }
    
    return 'unknown';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
