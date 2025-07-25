import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Carrera } from './entities/carrera.entity';
import { BimestreService } from '../common/services/bimestre.service';

@Injectable()
export class CarrerasService {
  constructor(
    @InjectRepository(Carrera)
    private readonly carreraRepository: Repository<Carrera>,
    private readonly bimestreService: BimestreService,
  ) {}

  async findAll(bimestreId?: number): Promise<Carrera[]> {
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
    
    return this.carreraRepository.find({
      where: whereCondition,
      relations: ['bimestre'],
      order: { nombre_carrera: 'ASC' }
    });
  }

  async findOne(id: number, bimestreId?: number): Promise<Carrera | null> {
    let whereCondition: any = { id, activo: true };
    
    if (bimestreId) {
      whereCondition.bimestre_id = bimestreId;
    } else {
      // Si no se especifica bimestre, usar el bimestre activo actual
      const bimestreActual = await this.bimestreService.findBimestreActual();
      if (bimestreActual) {
        whereCondition.bimestre_id = bimestreActual.id;
      }
    }
    
    return this.carreraRepository.findOne({
      where: whereCondition,
      relations: ['bimestre']
    });
  }

  async findByBimestre(bimestreId: number): Promise<Carrera[]> {
    return this.carreraRepository.find({
      where: { bimestre_id: bimestreId, activo: true },
      relations: ['bimestre'],
      order: { nombre_carrera: 'ASC' }
    });
  }
}