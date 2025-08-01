import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReporteCursablesAprobados } from './entities/reporte-cursables-aprobados.entity';

export interface VacantesRequeridas {
  sigla: string;
  asignatura: string;
  total_vacantes: number;
  plan?: string;
  nivel?: string;
}

@Injectable()
export class ReporteCursablesService {
  constructor(
    @InjectRepository(ReporteCursablesAprobados)
    private readonly reporteCursablesRepository: Repository<ReporteCursablesAprobados>,
  ) {}

  /**
   * Obtiene el total de vacantes requeridas para una sigla específica
   * @param sigla - Sigla de la asignatura
   * @param bimestreId - ID del bimestre (opcional)
   * @returns Información de vacantes requeridas
   */
  async getVacantesRequeridas(sigla: string, bimestreId?: number): Promise<VacantesRequeridas | null> {
    const queryBuilder = this.reporteCursablesRepository
      .createQueryBuilder('rca')
      .select([
        'rca.sigla as sigla',
        'rca.asignatura as asignatura',
        'COUNT(*) as total_vacantes',
        'rca.plan as plan',
        'rca.nivel as nivel'
      ])
      .where('rca.sigla = :sigla', { sigla })
      .groupBy('rca.sigla, rca.asignatura, rca.plan, rca.nivel');

    if (bimestreId) {
      queryBuilder.andWhere('rca.id_bimestre = :bimestreId', { bimestreId });
    }

    const result = await queryBuilder.getRawOne();
    
    if (!result) {
      return null;
    }

    return {
      sigla: result.sigla,
      asignatura: result.asignatura,
      total_vacantes: parseInt(result.total_vacantes, 10),
      plan: result.plan,
      nivel: result.nivel,
    };
  }

  /**
   * Obtiene todas las asignaturas con sus vacantes requeridas
   * @param bimestreId - ID del bimestre (opcional)
   * @returns Lista de asignaturas con vacantes requeridas
   */
  async getAllVacantesRequeridas(bimestreId?: number): Promise<VacantesRequeridas[]> {
    const queryBuilder = this.reporteCursablesRepository
      .createQueryBuilder('rca')
      .select([
        'rca.sigla as sigla',
        'rca.asignatura as asignatura',
        'COUNT(*) as total_vacantes',
        'rca.plan as plan',
        'rca.nivel as nivel'
      ])
      .groupBy('rca.sigla, rca.asignatura, rca.plan, rca.nivel')
      .orderBy('rca.sigla', 'ASC');

    if (bimestreId) {
      queryBuilder.where('rca.id_bimestre = :bimestreId', { bimestreId });
    }

    const results = await queryBuilder.getRawMany();
    
    return results.map(result => ({
      sigla: result.sigla,
      asignatura: result.asignatura,
      total_vacantes: parseInt(result.total_vacantes, 10),
      plan: result.plan,
      nivel: result.nivel,
    }));
  }

  /**
   * Obtiene estadísticas generales de vacantes por bimestre
   * @param bimestreId - ID del bimestre
   * @returns Estadísticas de vacantes
   */
  async getEstadisticasVacantes(bimestreId: number) {
    const totalVacantes = await this.reporteCursablesRepository
      .createQueryBuilder('rca')
      .where('rca.id_bimestre = :bimestreId', { bimestreId })
      .getCount();

    const asignaturasUnicas = await this.reporteCursablesRepository
      .createQueryBuilder('rca')
      .select('COUNT(DISTINCT rca.sigla) as count')
      .where('rca.id_bimestre = :bimestreId', { bimestreId })
      .getRawOne();

    return {
      total_vacantes: totalVacantes,
      asignaturas_unicas: parseInt(asignaturasUnicas.count, 10),
      bimestre_id: bimestreId,
    };
  }
}