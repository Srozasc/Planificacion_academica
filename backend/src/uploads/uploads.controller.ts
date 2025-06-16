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
  Param
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { BulkUploadOptions, UploadResultDto } from './dto/file-upload.dto';
import { UploadLoggingInterceptor } from './interceptors/upload-logging.interceptor';
import { FileCleanupService } from './services/file-cleanup.service';

@Controller('uploads')
@UseInterceptors(UploadLoggingInterceptor) // Aplicar logging a todo el controlador
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly fileCleanupService: FileCleanupService
  ) {}

  @Post('academic-structures')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAcademicStructures(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /(xlsx|xls)$/ }),
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }) // 10MB
        ]
      })
    ) file: Express.Multer.File,
    @Body() options: BulkUploadOptions
  ): Promise<UploadResultDto> {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo');
    }

    return this.uploadsService.processAcademicStructureFile(file, options);
  }

  @Post('teachers')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTeachers(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /(xlsx|xls)$/ }),
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })
        ]
      })
    ) file: Express.Multer.File,
    @Body() options: BulkUploadOptions
  ): Promise<UploadResultDto> {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo');
    }

    return this.uploadsService.processTeachersFile(file, options);
  }

  @Post('payment-codes')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPaymentCodes(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /(xlsx|xls)$/ }),
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })
        ]
      })
    ) file: Express.Multer.File,
    @Body() options: BulkUploadOptions
  ): Promise<UploadResultDto> {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo');
    }

    return this.uploadsService.processPaymentCodesFile(file, options);
  }

  @Post('course-reports')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCourseReports(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /(xlsx|xls)$/ }),
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })
        ]
      })
    ) file: Express.Multer.File,
    @Body() options: BulkUploadOptions
  ): Promise<UploadResultDto> {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo');
    }

    return this.uploadsService.processCourseReportsFile(file, options);
  }
  /**
   * Endpoint de administración para obtener estadísticas de archivos
   */
  @Get('admin/stats')
  async getUploadStats() {
    return this.fileCleanupService.getUploadStats();
  }

  /**
   * Endpoint de administración para limpiar archivos manualmente
   */
  @Delete('admin/cleanup')
  async manualCleanup() {
    await this.fileCleanupService.cleanupExpiredFiles();
    return { 
      message: 'Limpieza manual ejecutada correctamente',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Endpoint de administración para limpiar archivos por tipo específico
   */
  @Delete('admin/cleanup/:type')
  async cleanupByType(@Param('type') type: string) {
    const validTypes = ['temp', 'processed', 'failed'];
    if (!validTypes.includes(type)) {
      throw new BadRequestException(`Tipo inválido. Tipos válidos: ${validTypes.join(', ')}`);
    }

    const stats = await this.fileCleanupService.cleanupByType(type);
    return {
      message: `Limpieza de archivos ${type} completada`,
      stats,
      timestamp: new Date().toISOString()
    };
  }
}
