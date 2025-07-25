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
}