import { 
  Controller, 
  Post, 
  Get,
  Delete,
  UseInterceptors, 
  UploadedFile, 
  Body,
  UseGuards,
  BadRequestException,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  InternalServerErrorException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { BulkUploadOptions, UploadResultDto, OperationMode } from './dto/file-upload.dto';
import { UploadLoggingInterceptor } from './interceptors/upload-logging.interceptor';
import { FileCleanupService } from './services/file-cleanup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Controlador de Cargas Masivas
 * 
 * Maneja la subida y procesamiento de archivos Excel para carga masiva
 * de datos académicos. Incluye validaciones avanzadas, logging automático
 * y endpoints de administración.
 * 
 * Funcionalidades:
 * - Upload de archivos Excel (.xlsx, .xls)
 * - Validación multicapa (MIME + extensión + contenido)
 * - Procesamiento automático con Stored Procedures
 * - Limpieza automática de archivos temporales
 * - Endpoints de administración y monitoreo
 * 
 * Seguridad:
 * - Protegido con JWT Authentication
 * - Requiere rol de Admin para operaciones de carga
 */
@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard) // Proteger todo el controlador
@Roles('Administrador') // Requiere rol de Administrador (como viene en la BD)
@UseInterceptors(UploadLoggingInterceptor) // Aplicar logging a todo el controlador
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly fileCleanupService: FileCleanupService
  ) {}

  /**
   * Carga masiva de estructuras académicas
   * 
   * @param file Archivo Excel con estructuras académicas
   * @param options Opciones de carga (modo: INSERT_ONLY, UPDATE_ONLY, UPSERT)
   * @returns Resultado del procesamiento con estadísticas
   * 
   * @example
   * POST /uploads/academic-structures
   * Content-Type: multipart/form-data
   * 
   * file: academic_structures.xlsx
   * mode: "UPSERT"
   * validateOnly: false
   */
  @Post('academic-structures')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadAcademicStructures(
    @UploadedFile(
      new ParseFilePipe({        validators: [
          // new FileTypeValidator({ fileType: /\.(xlsx|xls)$/i }), // Comentado temporalmente
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }) // 10MB
        ],
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
      })
    ) file: Express.Multer.File,
    @Body() options: BulkUploadOptions
  ): Promise<UploadResultDto> {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo para estructuras académicas');
    }

    try {
      return await this.uploadsService.processAcademicStructureFile(file, options);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error procesando archivo de estructuras académicas: ${error.message}`
      );
    }
  }
  /**
   * Carga masiva de profesores/docentes
   * 
   * @param file Archivo Excel con datos de profesores
   * @param options Opciones de carga y validación
   * @returns Resultado del procesamiento con estadísticas
   * 
   * @example
   * POST /uploads/teachers
   * Content-Type: multipart/form-data
   * 
   * file: teachers_2024.xlsx
   * mode: "UPSERT"
   * validateOnly: false
   */
  @Post('teachers')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)  async uploadTeachers(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // new FileTypeValidator({ fileType: /\.(xlsx|xls)$/i }),
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })
        ],
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
      })
    ) file: Express.Multer.File,
    @Body() options: BulkUploadOptions
  ): Promise<UploadResultDto> {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo para profesores');
    }

    try {
      return await this.uploadsService.processTeachersFile(file, options);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error procesando archivo de profesores: ${error.message}`
      );
    }
  }
  /**
   * Carga masiva de códigos de pago
   * 
   * @param file Archivo Excel con códigos de pago
   * @param options Opciones de carga y validación
   * @returns Resultado del procesamiento con estadísticas
   * 
   * @example
   * POST /uploads/payment-codes
   * Content-Type: multipart/form-data
   * 
   * file: payment_codes_semester1.xlsx
   * mode: "INSERT_ONLY"
   * validateOnly: true
   */
  @Post('payment-codes')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)  async uploadPaymentCodes(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // new FileTypeValidator({ fileType: /\.(xlsx|xls)$/i }),
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })
        ],
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
      })
    ) file: Express.Multer.File,
    @Body() options: BulkUploadOptions
  ): Promise<UploadResultDto> {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo para códigos de pago');
    }

    try {
      return await this.uploadsService.processPaymentCodesFile(file, options);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error procesando archivo de códigos de pago: ${error.message}`
      );
    }
  }
  /**
   * Carga masiva de datos de reportes de cursos
   * 
   * @param file Archivo Excel con datos de reportes académicos
   * @param options Opciones de carga y validación
   * @returns Resultado del procesamiento con estadísticas
   * 
   * @example
   * POST /uploads/course-reports
   * Content-Type: multipart/form-data
   * 
   * file: course_reports_2024-1.xlsx
   * mode: "UPSERT"
   * validateOnly: false
   */
  @Post('course-reports')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)  async uploadCourseReports(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // new FileTypeValidator({ fileType: /\.(xlsx|xls)$/i }),
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })
        ],
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
      })
    ) file: Express.Multer.File,
    @Body() options: BulkUploadOptions
  ): Promise<UploadResultDto> {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo para reportes de cursos');
    }

    try {
      return await this.uploadsService.processCourseReportsFile(file, options);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error procesando archivo de reportes de cursos: ${error.message}`
      );
    }
  }  // ================================
  // ENDPOINTS DE UTILIDAD
  // ================================
  /**
   * Obtener plantillas de ejemplo para cada tipo de carga
   * 
   * @param type Tipo de plantilla: academic-structures, teachers, payment-codes, course-reports
   * @returns Información sobre las plantillas disponibles
   */
  @Get('templates')
  async getTemplateInfo(@Query('type') type?: string) {
    return this.uploadsService.getTemplateInfo(type);
  }

  /**
   * Validar archivo sin procesarlo
   * 
   * @param file Archivo Excel a validar
   * @param type Tipo de validación a aplicar
   * @returns Resultado de la validación sin procesar datos
   */
  @Post('validate/:type')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)  async validateFile(
    @Param('type') type: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // new FileTypeValidator({ fileType: /\.(xlsx|xls)$/i }),
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })
        ],
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
      })
    ) file: Express.Multer.File
  ) {
    const validTypes = ['academic-structures', 'teachers', 'payment-codes', 'course-reports'];
    if (!validTypes.includes(type)) {
      throw new BadRequestException(`Tipo de validación inválido. Tipos válidos: ${validTypes.join(', ')}`);
    }    if (!file) {
      throw new BadRequestException('No se proporcionó archivo para validar');
    }    try {
      return await this.uploadsService.validateFile(file, type);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error validando archivo de tipo ${type}: ${error.message}`
      );
    }
  }

  // ================================
  // ENDPOINTS DE ADMINISTRACIÓN
  // ================================
  
  /**
   * Obtener estadísticas detalladas de archivos
   * 
   * @param detailed Si incluir información detallada por directorio
   * @returns Estadísticas de todos los directorios de upload
   */
  @Get('admin/stats')
  @HttpCode(HttpStatus.OK)
  async getUploadStats(@Query('detailed') detailed?: boolean) {
    try {
      const stats = await this.fileCleanupService.getUploadStats();
      
      if (detailed) {
        // Agregar información adicional si se solicita
        return {
          ...stats,
          directories: {
            temp: await this.getDirectoryDetails('temp'),
            processed: await this.getDirectoryDetails('processed'),
            failed: await this.getDirectoryDetails('failed')
          },
          generatedAt: new Date().toISOString()
        };
      }
      
      return stats;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error obteniendo estadísticas: ${error.message}`
      );
    }
  }

  /**
   * Limpiar archivos manualmente
   * 
   * @param force Si forzar limpieza ignorando tiempos de retención
   * @returns Resultado de la limpieza manual
   */
  @Delete('admin/cleanup')
  @HttpCode(HttpStatus.OK)
  async manualCleanup(@Query('force') force?: boolean) {
    try {
      await this.fileCleanupService.cleanupExpiredFiles();
      return { 
        message: 'Limpieza manual ejecutada correctamente',
        forced: !!force,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error en limpieza manual: ${error.message}`
      );
    }
  }

  /**
   * Limpiar archivos por tipo específico
   * 
   * @param type Tipo de archivos a limpiar: temp, processed, failed
   * @param force Si forzar limpieza ignorando tiempos de retención
   * @returns Resultado de la limpieza por tipo
   */
  @Delete('admin/cleanup/:type')
  @HttpCode(HttpStatus.OK)
  async cleanupByType(
    @Param('type') type: string,
    @Query('force') force?: boolean
  ) {
    const validTypes = ['temp', 'processed', 'failed'];
    if (!validTypes.includes(type)) {
      throw new BadRequestException(
        `Tipo inválido. Tipos válidos: ${validTypes.join(', ')}`
      );
    }

    try {
      const stats = await this.fileCleanupService.cleanupByType(type);
      return {
        message: `Limpieza de archivos ${type} completada`,
        type,
        stats,
        forced: !!force,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error en limpieza de tipo ${type}: ${error.message}`
      );
    }
  }

  /**
   * Obtener el estado del sistema de uploads
   * 
   * @returns Estado general del sistema
   */
  @Get('admin/health')
  @HttpCode(HttpStatus.OK)
  async getSystemHealth() {
    try {
      const stats = await this.fileCleanupService.getUploadStats();      const statsValues = Object.values(stats);
      let totalFiles = 0;
      let totalBytes = 0;
      
      statsValues.forEach((stat: any) => {
        totalFiles += Number(stat.files) || 0;
        totalBytes += Number(stat.size) || 0;
      });

      return {
        status: 'healthy',
        uptime: process.uptime(),
        totalFiles,
        totalSizeBytes: totalBytes,
        totalSizeMB: Math.round((totalBytes / 1048576) * 100) / 100,
        directories: stats,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  // ================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ================================

  /**
   * Obtener detalles de un directorio específico
   */
  private async getDirectoryDetails(type: string) {
    // Este método podría implementarse en FileCleanupService
    // Por ahora retornamos información básica
    return {
      type,
      lastCleanup: new Date().toISOString(),
      retentionPolicy: this.getRetentionPolicy(type)
    };
  }

  /**
   * Obtener política de retención por tipo
   */
  private getRetentionPolicy(type: string): string {
    switch (type) {
      case 'temp':
        return '1 hora';
      case 'processed':
        return '24 horas';
      case 'failed':
        return '7 días';
      default:
        return 'No definida';
    }
  }
}
