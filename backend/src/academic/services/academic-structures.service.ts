import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { AcademicStructure, AcademicStructureType } from '../entities/academic-structure.entity';
import { CreateAcademicStructureDto } from '../dto/create-academic-structure.dto';
import { UpdateAcademicStructureDto } from '../dto/update-academic-structure.dto';
import { AcademicStructureResponseDto } from '../dto/academic-structure-response.dto';

@Injectable()
export class AcademicStructuresService {
  constructor(
    @InjectRepository(AcademicStructure)
    private academicStructureRepository: Repository<AcademicStructure>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    type?: string,
    plan_id?: number,
    is_active?: boolean
  ): Promise<{ data: AcademicStructureResponseDto[], total: number, page: number, totalPages: number }> {
    const offset = (page - 1) * limit;
    const safeLimit = Math.min(limit, 100); // Máximo 100 por página

    const queryBuilder = this.academicStructureRepository
      .createQueryBuilder('structure')
      .leftJoinAndSelect('structure.plan', 'plan')
      .where('structure.deleted_at IS NULL');

    // Filtros
    if (search) {
      queryBuilder.andWhere(
        '(structure.name LIKE :search OR structure.code LIKE :search OR structure.description LIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (type) {
      queryBuilder.andWhere('structure.type = :type', { type });
    }

    if (plan_id !== undefined) {
      queryBuilder.andWhere('structure.plan_id = :plan_id', { plan_id });
    }

    if (is_active !== undefined) {
      queryBuilder.andWhere('structure.is_active = :is_active', { is_active });
    }

    // Contar total
    const total = await queryBuilder.getCount();

    // Aplicar paginación y ordenamiento
    const structures = await queryBuilder
      .orderBy('structure.type', 'ASC')
      .addOrderBy('structure.semester', 'ASC')
      .addOrderBy('structure.name', 'ASC')
      .skip(offset)
      .take(safeLimit)
      .getMany();

    const totalPages = Math.ceil(total / safeLimit);

    return {
      data: structures.map(structure => 
        plainToClass(AcademicStructureResponseDto, structure, { excludeExtraneousValues: true })
      ),
      total,
      page,
      totalPages
    };
  }

  async findOne(id: number): Promise<AcademicStructureResponseDto> {
    const structure = await this.academicStructureRepository
      .createQueryBuilder('structure')
      .leftJoinAndSelect('structure.plan', 'plan')
      .leftJoinAndSelect('structure.subjects', 'subjects')
      .where('structure.id = :id AND structure.deleted_at IS NULL', { id })
      .getOne();

    if (!structure) {
      throw new NotFoundException(`Estructura académica con ID ${id} no encontrada`);
    }

    return plainToClass(AcademicStructureResponseDto, structure, {
      excludeExtraneousValues: true
    });
  }

  async create(createDto: CreateAcademicStructureDto): Promise<AcademicStructureResponseDto> {
    // Verificar que el código no exista
    const existingStructure = await this.academicStructureRepository.findOne({
      where: { code: createDto.code },
      withDeleted: true
    });

    if (existingStructure) {
      throw new ConflictException('El código ya está en uso');
    }    // Si se especifica plan_id, verificar que exista
    if (createDto.plan_id) {
      const plan = await this.academicStructureRepository.findOne({
        where: { id: createDto.plan_id, type: AcademicStructureType.PLAN, is_active: true }
      });

      if (!plan) {
        throw new BadRequestException('El plan especificado no existe o no está activo');
      }
    }

    // Crear la estructura
    const structure = this.academicStructureRepository.create({
      ...createDto,
      prerequisites: createDto.prerequisites ? createDto.prerequisites.join(', ') : null
    });

    const savedStructure = await this.academicStructureRepository.save(structure);

    return this.findOne(savedStructure.id);
  }

  async update(id: number, updateDto: UpdateAcademicStructureDto): Promise<AcademicStructureResponseDto> {
    // Verificar que la estructura exista
    const structure = await this.academicStructureRepository.findOne({
      where: { id },
      withDeleted: false
    });

    if (!structure) {
      throw new NotFoundException(`Estructura académica con ID ${id} no encontrada`);
    }

    // Si se actualiza el código, verificar unicidad
    if (updateDto.code && updateDto.code !== structure.code) {
      const existingStructure = await this.academicStructureRepository.findOne({
        where: { code: updateDto.code },
        withDeleted: true
      });

      if (existingStructure && existingStructure.id !== id) {
        throw new ConflictException('El código ya está en uso');
      }
    }    // Si se actualiza el plan_id, verificar que exista
    if (updateDto.plan_id && updateDto.plan_id !== structure.plan_id) {
      const plan = await this.academicStructureRepository.findOne({
        where: { id: updateDto.plan_id, type: AcademicStructureType.PLAN, is_active: true }
      });

      if (!plan) {
        throw new BadRequestException('El plan especificado no existe o no está activo');
      }
    }

    // Preparar datos de actualización
    const updateData: any = { ...updateDto };

    if (updateDto.prerequisites) {
      updateData.prerequisites = updateDto.prerequisites.join(', ');
    }

    // Actualizar
    await this.academicStructureRepository.update(id, updateData);

    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    // Verificar que la estructura exista
    const structure = await this.academicStructureRepository.findOne({
      where: { id },
      withDeleted: false
    });

    if (!structure) {
      throw new NotFoundException(`Estructura académica con ID ${id} no encontrada`);
    }    // Verificar si hay dependencias (asignaturas que dependen de este plan)
    if (structure.type === AcademicStructureType.PLAN) {
      const dependentSubjects = await this.academicStructureRepository.count({
        where: { plan_id: id, is_active: true }
      });

      if (dependentSubjects > 0) {
        throw new BadRequestException(
          `No se puede eliminar el plan porque tiene ${dependentSubjects} asignaturas asociadas`
        );
      }
    }

    // Soft delete
    await this.academicStructureRepository.softDelete(id);

    return { message: `Estructura académica con ID ${id} eliminada correctamente` };
  }

  async findByCode(code: string): Promise<AcademicStructure | null> {
    return this.academicStructureRepository.findOne({
      where: { code, is_active: true },
      relations: ['plan']
    });
  }
  async findPlans(): Promise<AcademicStructureResponseDto[]> {
    const plans = await this.academicStructureRepository.find({
      where: { type: AcademicStructureType.PLAN, is_active: true },
      order: { name: 'ASC' }
    });

    return plans.map(plan => 
      plainToClass(AcademicStructureResponseDto, plan, { excludeExtraneousValues: true })
    );
  }
}
