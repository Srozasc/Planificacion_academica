import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
  Logger,
  Get,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ResponseService } from '../common/services/response.service';
import { UploadService } from './uploads.service';
import { multerConfig } from './config/multer.config';

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadsController {
  private readonly logger = new Logger(UploadsController.name);

  constructor(
    private readonly uploadService: UploadService,
    private readonly responseService: ResponseService,
  ) {}



  @Post('adol')
  @Roles('Maestro', 'Editor')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadAdol(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { mode?: string; validateOnly?: string; bimestreId: string },
  ) {
    try {
      this.logger.log('=== INICIO PROCESO ADOL ===');
      this.logger.log(`Archivo recibido: ${file ? file.originalname : 'NO FILE'}`);
      this.logger.log(`Tamaño archivo: ${file ? file.size : 'N/A'} bytes`);
      this.logger.log(`Body completo recibido:`, JSON.stringify(body));
      this.logger.log(`BimestreId recibido: '${body.bimestreId}' (tipo: ${typeof body.bimestreId})`);
      
      if (!file) {
        this.logger.error('ERROR: No se ha proporcionado ningún archivo');
        throw new BadRequestException('No se ha proporcionado ningún archivo');
      }

      if (!body.bimestreId) {
        this.logger.error('ERROR: El ID del bimestre es requerido');
        throw new BadRequestException('El ID del bimestre es requerido');
      }

      const bimestreIdNum = parseInt(body.bimestreId, 10);
      this.logger.log(`BimestreId convertido a número: ${bimestreIdNum}`);
      
      if (isNaN(bimestreIdNum)) {
        this.logger.error(`ERROR: BimestreId inválido: '${body.bimestreId}'`);
        throw new BadRequestException('El ID del bimestre debe ser un número válido');
      }

      const validateOnly = body.validateOnly === 'true';
      const mode = body.mode || 'UPSERT';
      
      this.logger.log(`Parámetros procesados - Mode: ${mode}, ValidateOnly: ${validateOnly}, BimestreId: ${bimestreIdNum}`);

      const result = await this.uploadService.processAdol(
        file,
        { mode, validateOnly, bimestreId: bimestreIdNum },
      );

      this.logger.log('=== RESULTADO PROCESO ADOL ===');
      this.logger.log(`Total registros: ${result.summary?.totalRecords || 'N/A'}`);
      this.logger.log(`Registros válidos: ${result.summary?.validRecords || 'N/A'}`);
      this.logger.log(`Registros inválidos: ${result.summary?.invalidRecords || 'N/A'}`);
      this.logger.log('=== FIN PROCESO ADOL ===');

      return this.responseService.success(
        result,
        validateOnly
          ? 'Archivo validado exitosamente'
          : 'ADOL - Cargos docentes cargados exitosamente',
      );
    } catch (error) {
      this.logger.error('=== ERROR EN PROCESO ADOL ===');
      this.logger.error('Error al procesar ADOL:', error.message);
      this.logger.error('Stack trace:', error.stack);
      return this.responseService.error(
        'Error al procesar ADOL - Cargos docentes',
        [error.message],
      );
    }
  }

  @Post('dol')
  @Roles('Maestro', 'Editor')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadDol(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { mode?: string; validateOnly?: string; bimestreId: string },
  ) {
    try {
      this.logger.log('=== INICIO PROCESO DOL ===');
      this.logger.log(`Archivo recibido: ${file ? file.originalname : 'NO FILE'}`);
      this.logger.log(`Tamaño archivo: ${file ? file.size : 'N/A'} bytes`);
      this.logger.log(`Body completo recibido:`, JSON.stringify(body));
      this.logger.log(`BimestreId recibido: '${body.bimestreId}' (tipo: ${typeof body.bimestreId})`);
      
      if (!file) {
        this.logger.error('ERROR: No se ha proporcionado ningún archivo');
        throw new BadRequestException('No se ha proporcionado ningún archivo');
      }

      if (!body.bimestreId) {
        this.logger.error('ERROR: El ID del bimestre es requerido');
        throw new BadRequestException('El ID del bimestre es requerido');
      }

      const bimestreIdNum = parseInt(body.bimestreId, 10);
      this.logger.log(`BimestreId convertido a número: ${bimestreIdNum}`);
      
      if (isNaN(bimestreIdNum)) {
        this.logger.error(`ERROR: BimestreId inválido: '${body.bimestreId}'`);
        throw new BadRequestException('El ID del bimestre debe ser un número válido');
      }

      const validateOnly = body.validateOnly === 'true';
      const mode = body.mode || 'UPSERT';
      
      this.logger.log(`Parámetros procesados - Mode: ${mode}, ValidateOnly: ${validateOnly}, BimestreId: ${bimestreIdNum}`);

      const result = await this.uploadService.processDol(
        file,
        { mode, validateOnly, bimestreId: bimestreIdNum },
      );

      this.logger.log('=== RESULTADO PROCESO DOL ===');
      this.logger.log(`Total registros: ${result.summary?.totalRecords || 'N/A'}`);
      this.logger.log(`Registros válidos: ${result.summary?.validRecords || 'N/A'}`);
      this.logger.log(`Registros inválidos: ${result.summary?.invalidRecords || 'N/A'}`);
      this.logger.log('=== FIN PROCESO DOL ===');

      return this.responseService.success(
        result,
        validateOnly
          ? 'Archivo validado exitosamente'
          : 'DOL - Cargos docentes cargados exitosamente',
      );
    } catch (error) {
      this.logger.error('=== ERROR EN PROCESO DOL ===');
      this.logger.error('Error al procesar DOL:', error.message);
      this.logger.error('Stack trace:', error.stack);
      return this.responseService.error(
        'Error al procesar DOL - Cargos docentes',
        [error.message],
      );
    }
  }

  @Get('admin/stats')
  @Roles('Maestro')
  async getSystemStats() {
    try {
      const stats = await this.uploadService.getSystemStats();
      return this.responseService.success(
        stats,
        'Estadísticas del sistema obtenidas exitosamente',
      );
    } catch (error) {
      this.logger.error('Error al obtener estadísticas', error);
      return this.responseService.error(
        'Error al obtener estadísticas del sistema',
        [error.message],
      );
    }
  }

  @Get('admin/health')
  @Roles('Maestro')
  async getSystemHealth() {
    try {
      const health = await this.uploadService.getSystemHealth();
      return this.responseService.success(
        health,
        'Estado del sistema obtenido exitosamente',
      );
    } catch (error) {
      this.logger.error('Error al verificar estado del sistema', error);
      return this.responseService.error(
        'Error al verificar estado del sistema',
        [error.message],
      );
    }
  }

  @Delete('admin/cleanup/:type?')
  @Roles('Maestro')
  async cleanupFiles(@Param('type') type?: string) {
    try {
      const result = await this.uploadService.cleanupFiles(type);
      return this.responseService.success(
        result,
        'Limpieza de archivos completada exitosamente',
      );
    } catch (error) {
      this.logger.error('Error al limpiar archivos', error);
      return this.responseService.error(
        'Error al limpiar archivos',
        [error.message],
      );
    }
  }
}