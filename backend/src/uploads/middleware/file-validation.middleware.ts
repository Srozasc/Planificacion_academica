import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { fileTypeFromBuffer } from 'file-type';
import { UploadConfig, validateFile } from '../config/upload.config';

@Injectable()
export class FileValidationMiddleware implements NestMiddleware {
  
  async use(req: Request, res: Response, next: NextFunction) {
    // Solo aplicar a rutas de upload
    if (!req.path.includes('/uploads/')) {
      return next();
    }

    // Verificar que hay un archivo
    if (!req.file && req.method === 'POST') {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    if (req.file) {
      await this.validateUploadedFile(req.file, req.path);
    }

    next();
  }

  private async validateUploadedFile(file: Express.Multer.File, path: string): Promise<void> {
    // Validación básica usando la configuración
    const validation = validateFile(file, 'excel');
    if (!validation.isValid) {
      throw new BadRequestException(validation.error);
    }

    // Validación adicional del contenido del archivo (magic numbers)
    if (file.buffer || file.path) {
      await this.validateFileContent(file);
    }

    // Validaciones específicas por tipo de upload
    this.validateByUploadType(file, path);
  }

  private async validateFileContent(file: Express.Multer.File): Promise<void> {
    try {
      let buffer: Buffer;

      if (file.buffer) {
        buffer = file.buffer;
      } else if (file.path) {
        const fs = require('fs');
        buffer = fs.readFileSync(file.path);
      } else {
        return; // No se puede validar contenido
      }      // Verificar magic numbers del archivo
      const detectedType = await fileTypeFromBuffer(buffer.slice(0, 4100));
      
      if (detectedType) {
        const allowedMimes = UploadConfig.allowedMimeTypes.excel;
        
        // Verificar que el tipo detectado coincida con los permitidos
        if (!this.isValidExcelType(detectedType.mime)) {
          throw new BadRequestException(
            `El contenido del archivo no corresponde a un archivo Excel válido. ` +
            `Tipo detectado: ${detectedType.mime}`
          );
        }
      }

      // Validaciones adicionales para Excel
      await this.validateExcelStructure(buffer);

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Si no se puede determinar el tipo, permitir que pase
      // (algunos archivos Excel pueden no ser detectados correctamente)
      console.warn('No se pudo validar el tipo de archivo:', error.message);
    }
  }

  private isValidExcelType(detectedMime: string): boolean {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/zip', // .xlsx es técnicamente un ZIP
      'application/x-ole-storage' // .xls formato anterior
    ];

    return validTypes.includes(detectedMime);
  }

  private async validateExcelStructure(buffer: Buffer): Promise<void> {
    try {
      const XLSX = require('xlsx');
      
      // Intentar leer el archivo Excel
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new BadRequestException('El archivo Excel no contiene hojas válidas');
      }

      // Verificar que al menos la primera hoja tiene datos
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      
      if (!data || data.length < 2) {
        throw new BadRequestException(
          'El archivo Excel debe contener al menos una fila de encabezados y una fila de datos'
        );
      }

      // Verificar que hay encabezados válidos
      const headers = data[0] as any[];
      if (!headers || headers.length === 0 || headers.every(h => !h || h.toString().trim() === '')) {
        throw new BadRequestException(
          'El archivo Excel debe tener encabezados válidos en la primera fila'
        );
      }

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(
        `El archivo Excel no se puede procesar correctamente: ${error.message}`
      );
    }
  }

  private validateByUploadType(file: Express.Multer.File, path: string): void {
    const uploadType = this.extractUploadType(path);
    
    switch (uploadType) {
      case 'academic-structures':
        this.validateAcademicStructuresFile(file);
        break;
      case 'teachers':
        this.validateTeachersFile(file);
        break;
      case 'payment-codes':
        this.validatePaymentCodesFile(file);
        break;
      case 'course-reports':
        this.validateCourseReportsFile(file);
        break;
      default:
        // Validación general
        break;
    }
  }

  private validateAcademicStructuresFile(file: Express.Multer.File): void {
    // Validaciones específicas para estructuras académicas
    if (file.size > UploadConfig.maxFileSizes.excel) {
      throw new BadRequestException(
        `Archivo de estructuras académicas demasiado grande. ` +
        `Máximo permitido: ${UploadConfig.maxFileSizes.excel / 1024 / 1024}MB`
      );
    }
  }

  private validateTeachersFile(file: Express.Multer.File): void {
    // Validaciones específicas para docentes
    if (file.size > UploadConfig.maxFileSizes.excel) {
      throw new BadRequestException(
        `Archivo de docentes demasiado grande. ` +
        `Máximo permitido: ${UploadConfig.maxFileSizes.excel / 1024 / 1024}MB`
      );
    }
  }

  private validatePaymentCodesFile(file: Express.Multer.File): void {
    // Validaciones específicas para códigos de pago
    if (file.size > UploadConfig.maxFileSizes.excel) {
      throw new BadRequestException(
        `Archivo de códigos de pago demasiado grande. ` +
        `Máximo permitido: ${UploadConfig.maxFileSizes.excel / 1024 / 1024}MB`
      );
    }
  }

  private validateCourseReportsFile(file: Express.Multer.File): void {
    // Validaciones específicas para reportes de cursables
    if (file.size > UploadConfig.maxFileSizes.excel) {
      throw new BadRequestException(
        `Archivo de reportes de cursables demasiado grande. ` +
        `Máximo permitido: ${UploadConfig.maxFileSizes.excel / 1024 / 1024}MB`
      );
    }
  }

  private extractUploadType(path: string): string {
    const segments = path.split('/');
    const uploadsIndex = segments.indexOf('uploads');
    
    if (uploadsIndex !== -1 && uploadsIndex < segments.length - 1) {
      return segments[uploadsIndex + 1];
    }
    
    return 'unknown';
  }
}
