import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asignatura } from './entities/asignatura.entity';
import { BimestreService } from '../common/services/bimestre.service';

@Injectable()
export class AsignaturasService {
  constructor(
    @InjectRepository(Asignatura)
    private readonly asignaturaRepository: Repository<Asignatura>,
    private readonly bimestreService: BimestreService,
  ) {}

  async findAll(bimestreId?: number): Promise<Asignatura[]> {
    let whereCondition: any = { activo: true };
    
    if (bimestreId) {
      whereCondition.bimestre_id = bimestreId;
    } else {
      // Si no se especifica bimestre, usar el bimestre activo actual
      const bimestreActual = await this.bimestreService.findBimestreActual();
      if (bimestreActual) {
        whereCondition.bimestre_id = bimestreActual.id;
      }
    }
    
    return this.asignaturaRepository.find({
      where: whereCondition,
      relations: ['carrera', 'bimestre'],
      order: { nombre: 'ASC' }
    });
  }

  async findByCarrera(carreraId: number, bimestreId?: number): Promise<Asignatura[]> {
    let whereCondition: any = { carrera_id: carreraId, activo: true };
    
    if (bimestreId) {
      whereCondition.bimestre_id = bimestreId;
    } else {
      // Si no se especifica bimestre, usar el bimestre activo actual
      const bimestreActual = await this.bimestreService.findBimestreActual();
      if (bimestreActual) {
        whereCondition.bimestre_id = bimestreActual.id;
      }
    }
    
    return this.asignaturaRepository.find({
      where: whereCondition,
      relations: ['carrera', 'bimestre'],
      order: { nombre: 'ASC' }
    });
  }

  async findByBimestre(bimestreId: number): Promise<Asignatura[]> {
    return this.asignaturaRepository.find({
      where: { bimestre_id: bimestreId, activo: true },
      relations: ['carrera', 'bimestre'],
      order: { nombre: 'ASC' }
    });
  }

  async getCategorias(bimestreId?: number): Promise<string[]> {
    const queryBuilder = this.asignaturaRepository
      .createQueryBuilder('asignatura')
      .select('DISTINCT asignatura.categoria_asignatura', 'categoria')
      .where('asignatura.activo = :activo', { activo: true })
      .andWhere('asignatura.categoria_asignatura IS NOT NULL')
      .andWhere('asignatura.categoria_asignatura != :empty', { empty: '' });
    
    if (bimestreId) {
      queryBuilder.andWhere('asignatura.bimestre_id = :bimestreId', { bimestreId });
    } else {
      // Si no se especifica bimestre, usar el bimestre activo actual
      const bimestreActual = await this.bimestreService.findBimestreActual();
      if (bimestreActual) {
        queryBuilder.andWhere('asignatura.bimestre_id = :bimestreId', { bimestreId: bimestreActual.id });
      }
    }
    
    const result = await queryBuilder
      .orderBy('asignatura.categoria_asignatura', 'ASC')
      .getRawMany();

    return result.map(item => item.categoria).filter(categoria => categoria);
  }

  async getAdolAprobados(bimestreId?: number): Promise<{ sigla: string; descripcion: string }[]> {
    let query = `
      SELECT DISTINCT sigla, descripcion
      FROM adol_aprobados
      WHERE activo = 1
        AND sigla IS NOT NULL AND sigla != ''
        AND descripcion IS NOT NULL AND descripcion != ''
    `;
    
    const params = [];
    
    if (bimestreId) {
      query += ` AND id_bimestre = ?`;
      params.push(bimestreId);
    } else {
      // Si no se especifica bimestre, usar el bimestre activo actual
      const bimestreActual = await this.bimestreService.findBimestreActual();
      if (bimestreActual) {
        query += ` AND id_bimestre = ?`;
        params.push(bimestreActual.id);
      }
    }
    
    query += ` ORDER BY sigla ASC`;
    
    return this.asignaturaRepository.query(query, params);
  }

  async getOptativosAprobados(userId?: number, bimestreId?: number): Promise<{ plan: string; descripcion_asignatura: string; nivel: string; asignatura: string }[]> {
    let query = `
      SELECT DISTINCT 
        aoa.plan,
        aoa.descripcion_asignatura,
        aoa.nivel,
        aoa.asignatura
      FROM asignaturas_optativas_aprobadas aoa
      WHERE aoa.activo = 1
        AND aoa.plan IS NOT NULL AND aoa.plan != ''
        AND aoa.descripcion_asignatura IS NOT NULL AND aoa.descripcion_asignatura != ''
        AND aoa.nivel IS NOT NULL AND aoa.nivel != ''
    `;
    
    const params = [];
    
    if (bimestreId) {
      query += ` AND aoa.id_bimestre = ?`;
      params.push(bimestreId);
    } else {
      // Si no se especifica bimestre, usar el bimestre activo actual
      const bimestreActual = await this.bimestreService.findBimestreActual();
      if (bimestreActual) {
        query += ` AND aoa.id_bimestre = ?`;
        params.push(bimestreActual.id);
      }
    }
    
    query += ` ORDER BY aoa.plan ASC, aoa.descripcion_asignatura ASC`;
    
    return this.asignaturaRepository.query(query, params);
  }
}