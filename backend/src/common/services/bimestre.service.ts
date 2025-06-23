import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Bimestre } from '../entities/bimestre.entity';

export interface CreateBimestreDto {
  nombre: string;
  fechaInicio: Date;
  fechaFin: Date;
  anoAcademico: number;
  numeroBimestre: number;
  descripcion?: string;
}

export interface UpdateBimestreDto {
  nombre?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  activo?: boolean;
  descripcion?: string;
}

@Injectable()
export class BimestreService {
  private readonly logger = new Logger(BimestreService.name);

  constructor(
    @InjectRepository(Bimestre)
    private readonly bimestreRepository: Repository<Bimestre>,
  ) {}

  async findAll(): Promise<Bimestre[]> {
    try {
      return await this.bimestreRepository.find({
        order: { anoAcademico: 'DESC', numeroBimestre: 'ASC' }
      });
    } catch (error) {
      this.logger.error('Error al obtener bimestres', error);
      throw error;
    }
  }

  async findByAnoAcademico(anoAcademico: number): Promise<Bimestre[]> {
    try {
      return await this.bimestreRepository.find({
        where: { anoAcademico },
        order: { numeroBimestre: 'ASC' }
      });
    } catch (error) {
      this.logger.error(`Error al obtener bimestres del año ${anoAcademico}`, error);
      throw error;
    }
  }

  async findActivos(): Promise<Bimestre[]> {
    try {
      return await this.bimestreRepository.find({
        where: { activo: true },
        order: { anoAcademico: 'DESC', numeroBimestre: 'ASC' }
      });
    } catch (error) {
      this.logger.error('Error al obtener bimestres activos', error);
      throw error;
    }
  }

  async findById(id: number): Promise<Bimestre> {
    try {
      const bimestre = await this.bimestreRepository.findOne({
        where: { id }
      });

      if (!bimestre) {
        throw new NotFoundException(`Bimestre con ID ${id} no encontrado`);
      }

      return bimestre;
    } catch (error) {
      this.logger.error(`Error al obtener bimestre ${id}`, error);
      throw error;
    }
  }

  async findBimestreActual(): Promise<Bimestre | null> {
    try {
      const fechaActual = new Date();
      return await this.bimestreRepository.findOne({
        where: {
          fechaInicio: Between(new Date(fechaActual.getFullYear(), 0, 1), fechaActual),
          fechaFin: Between(fechaActual, new Date(fechaActual.getFullYear(), 11, 31)),
          activo: true
        }
      });
    } catch (error) {
      this.logger.error('Error al obtener bimestre actual', error);
      return null;
    }
  }

  async create(createBimestreDto: CreateBimestreDto): Promise<Bimestre> {
    try {
      // Validar fechas
      if (createBimestreDto.fechaInicio >= createBimestreDto.fechaFin) {
        throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
      }

      // Verificar que no exista otro bimestre con el mismo número en el mismo año
      const existingBimestre = await this.bimestreRepository.findOne({
        where: {
          anoAcademico: createBimestreDto.anoAcademico,
          numeroBimestre: createBimestreDto.numeroBimestre
        }
      });

      if (existingBimestre) {
        throw new BadRequestException(
          `Ya existe un bimestre ${createBimestreDto.numeroBimestre} para el año ${createBimestreDto.anoAcademico}`
        );
      }

      const bimestre = this.bimestreRepository.create(createBimestreDto);
      const savedBimestre = await this.bimestreRepository.save(bimestre);

      this.logger.log(`Bimestre creado: ${savedBimestre.nombre} (ID: ${savedBimestre.id})`);
      return savedBimestre;
    } catch (error) {
      this.logger.error('Error al crear bimestre', error);
      throw error;
    }
  }

  async update(id: number, updateBimestreDto: UpdateBimestreDto): Promise<Bimestre> {
    try {
      const bimestre = await this.findById(id);

      // Validar fechas si se proporcionan ambas
      if (updateBimestreDto.fechaInicio && updateBimestreDto.fechaFin) {
        if (updateBimestreDto.fechaInicio >= updateBimestreDto.fechaFin) {
          throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
        }
      }

      Object.assign(bimestre, updateBimestreDto);
      const updatedBimestre = await this.bimestreRepository.save(bimestre);

      this.logger.log(`Bimestre actualizado: ${updatedBimestre.nombre} (ID: ${updatedBimestre.id})`);
      return updatedBimestre;
    } catch (error) {
      this.logger.error(`Error al actualizar bimestre ${id}`, error);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const result = await this.bimestreRepository.delete(id);
      
      if (result.affected === 0) {
        throw new NotFoundException(`Bimestre con ID ${id} no encontrado`);
      }

      this.logger.log(`Bimestre eliminado: ID ${id}`);
    } catch (error) {
      this.logger.error(`Error al eliminar bimestre ${id}`, error);
      throw error;
    }
  }

  async activar(id: number): Promise<Bimestre> {
    return this.update(id, { activo: true });
  }

  async desactivar(id: number): Promise<Bimestre> {
    return this.update(id, { activo: false });
  }

  // Método helper para generar bimestres automáticamente
  async generarBimestresAnoAcademico(
    anoAcademico: number,
    fechaInicioAno: Date
  ): Promise<Bimestre[]> {
    try {
      const bimestres: Bimestre[] = [];
      const duracionBimestre = 60; // días aproximados

      for (let i = 1; i <= 4; i++) {
        const fechaInicio = new Date(fechaInicioAno);
        fechaInicio.setDate(fechaInicio.getDate() + (i - 1) * duracionBimestre);

        const fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaFin.getDate() + duracionBimestre - 1);

        const createDto: CreateBimestreDto = {
          nombre: `${this.getOrdinal(i)} Bimestre ${anoAcademico}`,
          fechaInicio,
          fechaFin,
          anoAcademico,
          numeroBimestre: i,
          descripcion: `${this.getOrdinal(i)} bimestre del año académico ${anoAcademico}`
        };

        const bimestre = await this.create(createDto);
        bimestres.push(bimestre);
      }

      this.logger.log(`Generados 4 bimestres para el año académico ${anoAcademico}`);
      return bimestres;
    } catch (error) {
      this.logger.error(`Error al generar bimestres para año ${anoAcademico}`, error);
      throw error;
    }
  }

  private getOrdinal(num: number): string {
    const ordinals = ['Primer', 'Segundo', 'Tercer', 'Cuarto'];
    return ordinals[num - 1] || `${num}°`;
  }
}
