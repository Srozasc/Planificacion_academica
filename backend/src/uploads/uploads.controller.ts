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
  Query,
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

  @Post('vacantes-inicio')
  @Roles('Maestro', 'Editor')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadVacantesInicio(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { mode?: string; validateOnly?: string; bimestreId: string },
  ) {
    try {
      this.logger.log('=== INICIO PROCESO VACANTES INICIO ===');
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

      const result = await this.uploadService.processVacantesInicio(
        file,
        { mode, validateOnly, bimestreId: bimestreIdNum },
      );

      this.logger.log('=== RESULTADO PROCESO VACANTES INICIO ===');
      this.logger.log(`Total registros: ${result.summary?.totalRecords || 'N/A'}`);
      this.logger.log(`Registros válidos: ${result.summary?.validRecords || 'N/A'}`);
      this.logger.log(`Registros inválidos: ${result.summary?.invalidRecords || 'N/A'}`);
      this.logger.log('=== FIN PROCESO VACANTES INICIO ===');

      return this.responseService.success(
        result,
        validateOnly
          ? 'Archivo validado exitosamente'
          : 'Vacantes Inicio cargadas exitosamente',
      );
    } catch (error) {
      this.logger.error('=== ERROR EN PROCESO VACANTES INICIO ===');
      this.logger.error('Error al procesar Vacantes Inicio:', error.message);
      this.logger.error('Stack trace:', error.stack);
      return this.responseService.error(
        'Error al procesar Vacantes Inicio',
        [error.message],
      );
    }
  }

  @Post('estructura-academica')
  @Roles('Maestro', 'Editor')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadEstructuraAcademica(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { mode?: string; validateOnly?: string; bimestreId: string },
  ) {
    try {
      this.logger.log('=== INICIO PROCESO ESTRUCTURA ACADEMICA ===');
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

      const result = await this.uploadService.processEstructuraAcademica(
        file,
        { mode, validateOnly, bimestreId: bimestreIdNum },
      );

      this.logger.log('=== RESULTADO PROCESO ESTRUCTURA ACADEMICA ===');
      this.logger.log(`Total registros: ${result.summary?.totalRecords || 'N/A'}`);
      this.logger.log(`Registros válidos: ${result.summary?.validRecords || 'N/A'}`);
      this.logger.log(`Registros inválidos: ${result.summary?.invalidRecords || 'N/A'}`);
      this.logger.log('=== FIN PROCESO ESTRUCTURA ACADEMICA ===');

      return this.responseService.success(
        result,
        validateOnly
          ? 'Archivo validado exitosamente'
          : 'Estructura Académica cargada exitosamente',
      );
    } catch (error) {
      this.logger.error('=== ERROR EN PROCESO ESTRUCTURA ACADEMICA ===');
      this.logger.error('Error al procesar Estructura Académica:', error.message);
      this.logger.error('Stack trace:', error.stack);
      return this.responseService.error(
        'Error al procesar Estructura Académica',
        [error.message],
      );
    }
  }

  @Post('reporte-cursables')
  @Roles('Maestro', 'Editor')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadReporteCursables(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { mode?: string; validateOnly?: string; bimestreId: string },
  ) {
    try {
      this.logger.log('=== INICIO PROCESO REPORTE CURSABLES ===');
      this.logger.log(`Archivo recibido: ${file ? file.originalname : 'NO FILE'}`);
      this.logger.log(`Tamaño archivo: ${file ? file.size : 'N/A'} bytes`);
      this.logger.log(`Body completo recibido:`, JSON.stringify(body));
      this.logger.log(`BimestreId recibido: '${body.bimestreId}' (tipo: ${typeof body.bimestreId})`);
      
      if (!file) {
        this.logger.error('ERROR: No se ha proporcionado ningún archivo');
        throw new BadRequestException('No se ha proporcionado ningún archivo');
      }

      if (!body.bimestreId) {
        this.logger.error('ERROR: BimestreId es requerido');
        throw new BadRequestException('BimestreId es requerido');
      }

      const bimestreId = parseInt(body.bimestreId, 10);
      if (isNaN(bimestreId)) {
        this.logger.error(`ERROR: BimestreId inválido: '${body.bimestreId}'`);
        throw new BadRequestException('BimestreId debe ser un número válido');
      }

      this.logger.log(`BimestreId parseado correctamente: ${bimestreId}`);

      const options = {
        mode: body.mode || 'full',
        validateOnly: body.validateOnly === 'true',
        bimestreId: bimestreId,
      };

      this.logger.log(`Opciones finales para el servicio:`, JSON.stringify(options));

      const result = await this.uploadService.processReporteCursables(file, options);
      
      this.logger.log('=== RESULTADO FINAL CONTROLLER REPORTE CURSABLES ===');
      this.logger.log(JSON.stringify(result, null, 2));

      if (result.success) {
        return this.responseService.success(
          result,
          result.message || 'Reporte Cursables procesado exitosamente',
        );
      } else {
        return this.responseService.error(
          result.message || 'Error procesando Reporte Cursables',
          result.errors || [],
        );
      }
    } catch (error) {
      this.logger.error('=== ERROR EN CONTROLLER REPORTE CURSABLES ===');
      this.logger.error('Error en uploadReporteCursables:', error.message);
      this.logger.error('Stack trace:', error.stack);
      return this.responseService.error(
        'Error interno del servidor al procesar Reporte Cursables',
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

  @Post('nomina-docentes')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @Roles('Maestro', 'Editor')
  async uploadNominaDocentes(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { mode?: string; validateOnly?: string; bimestreId: string },
  ) {
    try {
      this.logger.log('=== INICIO PROCESO NOMINA DOCENTES ===');
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

      const bimestreId = parseInt(body.bimestreId, 10);
      if (isNaN(bimestreId)) {
        this.logger.error(`ERROR: BimestreId inválido: '${body.bimestreId}'`);
        throw new BadRequestException('El ID del bimestre debe ser un número válido');
      }

      this.logger.log(`BimestreId parseado correctamente: ${bimestreId}`);

      const options = {
        mode: body.mode || 'full',
        validateOnly: body.validateOnly === 'true',
        bimestreId: bimestreId,
      };

      this.logger.log(`Opciones finales para el servicio:`, JSON.stringify(options));
      this.logger.log('Llamando al servicio processNominaDocentes...');
      
      const result = await this.uploadService.processNominaDocentes(file, options);
      
      this.logger.log('=== RESULTADO DEL SERVICIO ===');
      this.logger.log('Resultado recibido del servicio:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        this.logger.log('=== PROCESO EXITOSO ===');
        return this.responseService.success(
          result,
          result.message,
        );
      } else {
        this.logger.error('=== PROCESO CON ERRORES ===');
        this.logger.error('Errores:', result.errors);
        return this.responseService.error(
          result.message,
          result.errors || [],
        );
      }
    } catch (error) {
      this.logger.error('=== ERROR EN CONTROLADOR NOMINA DOCENTES ===');
      this.logger.error('Error en uploadNominaDocentes:', error.message);
      this.logger.error('Stack trace:', error.stack);
      
      return this.responseService.error(
        'Error interno del servidor',
        [error.message],
      );
    }
  }

  @Get('details/:uploadId')
  @Roles('Maestro', 'Editor')
  async getUploadDetails(@Param('uploadId') uploadId: string) {
    try {
      this.logger.log(`=== OBTENIENDO DETALLES DE CARGA: ${uploadId} ===`);
      
      const details = await this.uploadService.getUploadDetails(uploadId);
      
      this.logger.log('Detalles obtenidos exitosamente');
      return this.responseService.success(
        details,
        'Detalles de carga obtenidos exitosamente',
      );
    } catch (error) {
      this.logger.error('=== ERROR AL OBTENER DETALLES DE CARGA ===');
      this.logger.error('Error:', error.message);
      this.logger.error('Stack trace:', error.stack);
      
      return this.responseService.error(
        'Error al obtener detalles de la carga',
        [error.message],
      );
    }
  }

  // Nuevos endpoints para gestión de cargas
  @Get('recent')
  @Roles('Maestro', 'Editor')
  async getRecentUploads() {
    try {
      this.logger.log('=== OBTENIENDO CARGAS RECIENTES ===');
      
      const recentUploads = await this.uploadService.getRecentUploads();
      
      this.logger.log('Cargas recientes obtenidas exitosamente');
      return this.responseService.success(
        recentUploads,
        'Cargas recientes obtenidas exitosamente'
      );
    } catch (error) {
      this.logger.error('=== ERROR AL OBTENER CARGAS RECIENTES ===');
      this.logger.error('Error:', error.message);
      this.logger.error('Stack trace:', error.stack);
      
      return this.responseService.error(
        'Error al obtener cargas recientes',
        [error.message],
      );
    }
  }

  @Get('history')
  async getUploadHistory(@Query() query: any) {
    try {
      this.logger.log('=== OBTENIENDO HISTORIAL DE CARGAS ===');
      this.logger.log('Query params:', query);
      
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 20;
      const filters = {
        uploadType: query.uploadType,
        status: query.status,
        approvalStatus: query.approvalStatus,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo
      };
      
      // Remover filtros vacíos
      Object.keys(filters).forEach(key => {
        if (!filters[key]) {
          delete filters[key];
        }
      });
      
      const history = await this.uploadService.getUploadHistory(page, limit, filters);
      
      this.logger.log('Historial de cargas obtenido exitosamente');
      return this.responseService.success(
        history,
        'Historial de cargas obtenido exitosamente'
      );
    } catch (error) {
      this.logger.error('=== ERROR AL OBTENER HISTORIAL DE CARGAS ===');
      this.logger.error('Error:', error.message);
      this.logger.error('Stack trace:', error.stack);
      
      return this.responseService.error(
        'Error al obtener historial de cargas',
        [error.message],
      );
    }
  }

  @Post('approve/:uploadId')
  @Roles('Maestro')
  async approveUpload(
    @Param('uploadId') uploadId: string,
    @Body() body: { userId: number },
  ) {
    try {
      this.logger.log(`=== APROBANDO CARGA: ${uploadId} ===`);
      this.logger.log(`Usuario aprobador: ${body.userId}`);
      
      const result = await this.uploadService.approveUpload(
        parseInt(uploadId),
        body.userId,
      );
      
      this.logger.log('Carga aprobada exitosamente');
      return this.responseService.success(
        result,
        'Carga aprobada exitosamente'
      );
    } catch (error) {
      this.logger.error('=== ERROR AL APROBAR CARGA ===');
      this.logger.error('Error:', error.message);
      this.logger.error('Stack trace:', error.stack);
      
      return this.responseService.error(
        'Error al aprobar la carga',
        [error.message],
      );
    }
  }

  @Post('reject/:uploadId')
  @Roles('Maestro')
  async rejectUpload(
    @Param('uploadId') uploadId: string,
    @Body() body: { userId: number; reason?: string },
  ) {
    try {
      this.logger.log(`=== RECHAZANDO CARGA: ${uploadId} ===`);
      this.logger.log(`Usuario que rechaza: ${body.userId}`);
      this.logger.log(`Razón: ${body.reason || 'No especificada'}`);
      
      const result = await this.uploadService.rejectUpload(
        parseInt(uploadId),
        body.userId,
        body.reason,
      );
      
      this.logger.log('Carga rechazada exitosamente');
      return this.responseService.success(
        result,
        'Carga rechazada exitosamente'
      );
    } catch (error) {
      this.logger.error('=== ERROR AL RECHAZAR CARGA ===');
      this.logger.error('Error:', error.message);
      this.logger.error('Stack trace:', error.stack);
      
      return this.responseService.error(
        'Error al rechazar la carga',
        [error.message],
      );
    }
  }

}