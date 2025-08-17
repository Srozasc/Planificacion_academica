import {
  Controller,
  Post,
  Body,
  UseGuards,
  Logger,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { BimestreCleanupService, CleanupParams } from '../services/bimestre-cleanup.service';
import { ResponseService } from '../../common/services/response.service';

/**
 * Controlador para la gestión manual de limpieza de bimestres
 * Permite a los administradores ejecutar y monitorear procesos de limpieza
 */
@Controller('bimestres/cleanup')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BimestreCleanupController {
  private readonly logger = new Logger(BimestreCleanupController.name);

  constructor(
    private readonly cleanupService: BimestreCleanupService,
    private readonly responseService: ResponseService,
  ) {}

  /**
   * Ejecuta una limpieza manual de bimestres
   * POST /bimestres/cleanup
   */
  @Post()
  @Roles('Maestro')
  async executeManualCleanup(@Body() params: Partial<CleanupParams> = {}) {
    try {
      this.logger.log('Ejecutando limpieza manual de bimestres');
      
      // Parámetros por defecto para ejecución manual
      const cleanupParams: CleanupParams = {
        monthsThreshold: params.monthsThreshold || 24,
        maxBimestresPerExecution: params.maxBimestresPerExecution || 10,
        debugMode: params.debugMode ?? true, // Por defecto en modo debug para ejecución manual
        performBackup: params.performBackup ?? true,
      };
      
      const result = await this.cleanupService.executeCleanup(cleanupParams);
      
      return this.responseService.success(
        result,
        'Limpieza de bimestres ejecutada exitosamente'
      );
    } catch (error) {
      this.logger.error('Error en limpieza manual:', error);
      throw error;
    }
  }

  /**
   * Identifica bimestres candidatos para limpieza sin ejecutar la eliminación
   * GET /bimestres/cleanup/candidates
   */
  @Get('candidates')
  @Roles('Maestro', 'Editor')
  async identifyCandidates(
    @Query('monthsThreshold') monthsThreshold?: number
  ) {
    try {
      const candidates = await this.cleanupService.identifyCandidates(
        monthsThreshold || 24
      );
      
      return this.responseService.success(
        candidates,
        'Bimestres candidatos identificados exitosamente'
      );
    } catch (error) {
      this.logger.error('Error al identificar candidatos:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de ejecuciones de limpieza
   * GET /bimestres/cleanup/history
   */
  @Get('history')
  @Roles('Maestro', 'Editor')
  async getCleanupHistory() {
    try {
      const history = await this.cleanupService.getCleanupHistory();
      
      return this.responseService.success(
        history,
        'Historial de limpieza obtenido exitosamente'
      );
    } catch (error) {
      this.logger.error('Error al obtener historial:', error);
      throw error;
    }
  }

  /**
   * Obtiene los detalles de una ejecución específica
   * GET /bimestres/cleanup/details/:executionId
   */
  @Get('details/:executionId')
  @Roles('Maestro', 'Editor')
  async getCleanupDetails(@Param('executionId') executionId: string) {
    try {
      const details = await this.cleanupService.getCleanupDetails(executionId);
      
      return this.responseService.success(
        details,
        'Detalles de ejecución obtenidos exitosamente'
      );
    } catch (error) {
      this.logger.error(`Error al obtener detalles de ejecución ${executionId}:`, error);
      throw error;
    }
  }
}