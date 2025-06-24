import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Bimestre } from '../entities/bimestre.entity';

export interface CreateBimestreDto {
  nombre: string;
  fechaInicio: string; // Cambiado a string para manejar conversión manual
  fechaFin: string;    // Cambiado a string para manejar conversión manual
  anoAcademico: number;
  numeroBimestre: number;
  descripcion?: string;
}

export interface UpdateBimestreDto {
  nombre?: string;
  fechaInicio?: string; // Cambiado a string para manejar conversión manual
  fechaFin?: string;    // Cambiado a string para manejar conversión manual
  descripcion?: string;
}

@Injectable()
export class BimestreService {
  private readonly logger = new Logger(BimestreService.name);

  constructor(
    @InjectRepository(Bimestre)
    private readonly bimestreRepository: Repository<Bimestre>,
  ) {}

  // Método helper para parsear fechas manteniendo la zona horaria local
  private parseLocalDate(dateString: string): Date {
    // Aseguramos que la fecha se interprete como fecha local sin conversión UTC
    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
    return new Date(year, month - 1, day); // month - 1 porque Date usa índices 0-11 para meses
  }

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
      // Parsear fechas manteniendo la zona horaria local
      const fechaInicio = this.parseLocalDate(createBimestreDto.fechaInicio);
      const fechaFin = this.parseLocalDate(createBimestreDto.fechaFin);
      
      // Validar fechas
      if (fechaInicio >= fechaFin) {
        throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
      }

      // Validar que no exista otro bimestre con el mismo número en el mismo año
      const existingBimestre = await this.bimestreRepository.findOne({
        where: {
          numeroBimestre: createBimestreDto.numeroBimestre,
          anoAcademico: createBimestreDto.anoAcademico
        }
      });

      if (existingBimestre) {
        throw new BadRequestException(`Ya existe un bimestre ${createBimestreDto.numeroBimestre} para el año ${createBimestreDto.anoAcademico}`);
      }      // Nota: Se permite flexibilidad total en la numeración de bimestres
      // Los usuarios pueden crear bimestres con cualquier número según sus necesidades

      const bimestre = this.bimestreRepository.create({
        ...createBimestreDto,
        fechaInicio,
        fechaFin
      });
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

      // Parsear fechas si se proporcionan
      const updateData: any = { ...updateBimestreDto };
      if (updateBimestreDto.fechaInicio) {
        updateData.fechaInicio = this.parseLocalDate(updateBimestreDto.fechaInicio);
      }
      if (updateBimestreDto.fechaFin) {
        updateData.fechaFin = this.parseLocalDate(updateBimestreDto.fechaFin);
      }

      // Validar fechas si se proporcionan ambas
      const fechaInicio = updateData.fechaInicio || bimestre.fechaInicio;
      const fechaFin = updateData.fechaFin || bimestre.fechaFin;
      
      if (fechaInicio >= fechaFin) {
        throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
      }

      Object.assign(bimestre, updateData);
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
      }      this.logger.log(`Bimestre eliminado: ID ${id}`);
    } catch (error) {
      this.logger.error(`Error al eliminar bimestre ${id}`, error);
      throw error;
    }
  }
}
