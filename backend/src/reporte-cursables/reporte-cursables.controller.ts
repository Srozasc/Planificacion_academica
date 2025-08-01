import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReporteCursablesService, VacantesRequeridas } from './reporte-cursables.service';

@Controller('reporte-cursables')
export class ReporteCursablesController {
  constructor(private readonly reporteCursablesService: ReporteCursablesService) {}

  /**
   * Obtiene el total de vacantes requeridas para una sigla específica
   * GET /reporte-cursables/vacantes/:sigla
   */
  @Get('vacantes/:sigla')
  async getVacantesRequeridas(
    @Param('sigla') sigla: string,
    @Query('bimestreId') bimestreId?: string,
  ): Promise<VacantesRequeridas | null> {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    return this.reporteCursablesService.getVacantesRequeridas(sigla, bimestreIdNum);
  }

  /**
   * Obtiene todas las asignaturas con sus vacantes requeridas
   * GET /reporte-cursables/vacantes
   */
  @Get('vacantes')
  async getAllVacantesRequeridas(
    @Query('bimestreId') bimestreId?: string,
  ): Promise<VacantesRequeridas[]> {
    const bimestreIdNum = bimestreId ? parseInt(bimestreId, 10) : undefined;
    return this.reporteCursablesService.getAllVacantesRequeridas(bimestreIdNum);
  }

  /**
   * Obtiene estadísticas generales de vacantes por bimestre
   * GET /reporte-cursables/estadisticas/:bimestreId
   */
  @Get('estadisticas/:bimestreId')
  async getEstadisticasVacantes(
    @Param('bimestreId') bimestreId: string,
  ) {
    const bimestreIdNum = parseInt(bimestreId, 10);
    return this.reporteCursablesService.getEstadisticasVacantes(bimestreIdNum);
  }
}