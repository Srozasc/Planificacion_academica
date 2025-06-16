import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { Teacher } from '../entities/teacher.entity';
import { CreateTeacherDto } from '../dto/create-teacher.dto';
import { UpdateTeacherDto } from '../dto/update-teacher.dto';
import { TeacherResponseDto } from '../dto/teacher-response.dto';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    is_active?: boolean,
    can_coordinate?: boolean,
    category_id?: number,
    contract_type_id?: number
  ): Promise<{ data: TeacherResponseDto[], total: number, page: number, totalPages: number }> {
    const offset = (page - 1) * limit;
    const safeLimit = Math.min(limit, 100); // Máximo 100 por página

    const queryBuilder = this.teacherRepository
      .createQueryBuilder('teacher')
      .where('teacher.deleted_at IS NULL');

    // Filtros
    if (search) {
      queryBuilder.andWhere(
        '(teacher.name LIKE :search OR teacher.rut LIKE :search OR teacher.email LIKE :search OR teacher.specialization LIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (is_active !== undefined) {
      queryBuilder.andWhere('teacher.is_active = :is_active', { is_active });
    }

    if (can_coordinate !== undefined) {
      queryBuilder.andWhere('teacher.can_coordinate = :can_coordinate', { can_coordinate });
    }

    if (category_id !== undefined) {
      queryBuilder.andWhere('teacher.category_id = :category_id', { category_id });
    }

    if (contract_type_id !== undefined) {
      queryBuilder.andWhere('teacher.contract_type_id = :contract_type_id', { contract_type_id });
    }

    // Ordenamiento
    queryBuilder.orderBy('teacher.name', 'ASC');

    // Paginación
    const [teachers, total] = await queryBuilder
      .skip(offset)
      .take(safeLimit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / safeLimit);

    return {
      data: teachers.map(teacher => plainToClass(TeacherResponseDto, teacher, { excludeExtraneousValues: true })),
      total,
      page,
      totalPages
    };
  }

  async findOne(id: number): Promise<TeacherResponseDto> {
    const teacher = await this.teacherRepository.findOne({
      where: { id, deleted_at: null }
    });

    if (!teacher) {
      throw new NotFoundException(`Docente con ID ${id} no encontrado`);
    }

    return plainToClass(TeacherResponseDto, teacher, { excludeExtraneousValues: true });
  }

  async findByRut(rut: string): Promise<TeacherResponseDto> {
    const teacher = await this.teacherRepository.findOne({
      where: { rut, deleted_at: null }
    });

    if (!teacher) {
      throw new NotFoundException(`Docente con RUT ${rut} no encontrado`);
    }

    return plainToClass(TeacherResponseDto, teacher, { excludeExtraneousValues: true });
  }

  async findByEmail(email: string): Promise<TeacherResponseDto> {
    const teacher = await this.teacherRepository.findOne({
      where: { email, deleted_at: null }
    });

    if (!teacher) {
      throw new NotFoundException(`Docente con email ${email} no encontrado`);
    }

    return plainToClass(TeacherResponseDto, teacher, { excludeExtraneousValues: true });
  }

  async findActiveTeachers(): Promise<TeacherResponseDto[]> {
    const teachers = await this.teacherRepository.find({
      where: { is_active: true, deleted_at: null },
      order: { name: 'ASC' }
    });

    return teachers.map(teacher => plainToClass(TeacherResponseDto, teacher, { excludeExtraneousValues: true }));
  }

  async findCoordinators(): Promise<TeacherResponseDto[]> {
    const teachers = await this.teacherRepository.find({
      where: { 
        is_active: true, 
        can_coordinate: true, 
        deleted_at: null 
      },
      order: { name: 'ASC' }
    });

    return teachers.map(teacher => plainToClass(TeacherResponseDto, teacher, { excludeExtraneousValues: true }));
  }

  async create(createTeacherDto: CreateTeacherDto): Promise<TeacherResponseDto> {
    // Validar RUT único
    const existingTeacherByRut = await this.teacherRepository.findOne({
      where: { rut: createTeacherDto.rut }
    });

    if (existingTeacherByRut) {
      throw new ConflictException(`Ya existe un docente con RUT ${createTeacherDto.rut}`);
    }

    // Validar email único
    const existingTeacherByEmail = await this.teacherRepository.findOne({
      where: { email: createTeacherDto.email }
    });

    if (existingTeacherByEmail) {
      throw new ConflictException(`Ya existe un docente con email ${createTeacherDto.email}`);
    }

    // Validar formato de RUT
    if (!this.validateRut(createTeacherDto.rut)) {
      throw new BadRequestException('El RUT proporcionado no es válido');
    }

    // Normalizar RUT (remover puntos y dejar solo guión)
    createTeacherDto.rut = this.normalizeRut(createTeacherDto.rut);

    const teacher = this.teacherRepository.create(createTeacherDto);
    const savedTeacher = await this.teacherRepository.save(teacher);

    return plainToClass(TeacherResponseDto, savedTeacher, { excludeExtraneousValues: true });
  }

  async update(id: number, updateTeacherDto: UpdateTeacherDto): Promise<TeacherResponseDto> {
    const teacher = await this.teacherRepository.findOne({
      where: { id, deleted_at: null }
    });

    if (!teacher) {
      throw new NotFoundException(`Docente con ID ${id} no encontrado`);
    }

    // Validar RUT único si se está actualizando
    if (updateTeacherDto.rut && updateTeacherDto.rut !== teacher.rut) {
      const existingTeacherByRut = await this.teacherRepository.findOne({
        where: { rut: updateTeacherDto.rut }
      });

      if (existingTeacherByRut) {
        throw new ConflictException(`Ya existe un docente con RUT ${updateTeacherDto.rut}`);
      }

      // Validar formato de RUT
      if (!this.validateRut(updateTeacherDto.rut)) {
        throw new BadRequestException('El RUT proporcionado no es válido');
      }

      // Normalizar RUT
      updateTeacherDto.rut = this.normalizeRut(updateTeacherDto.rut);
    }

    // Validar email único si se está actualizando
    if (updateTeacherDto.email && updateTeacherDto.email !== teacher.email) {
      const existingTeacherByEmail = await this.teacherRepository.findOne({
        where: { email: updateTeacherDto.email }
      });

      if (existingTeacherByEmail) {
        throw new ConflictException(`Ya existe un docente con email ${updateTeacherDto.email}`);
      }
    }

    // Aplicar actualizaciones
    Object.assign(teacher, updateTeacherDto);
    const updatedTeacher = await this.teacherRepository.save(teacher);

    return plainToClass(TeacherResponseDto, updatedTeacher, { excludeExtraneousValues: true });
  }

  async remove(id: number): Promise<{ message: string }> {
    const teacher = await this.teacherRepository.findOne({
      where: { id, deleted_at: null }
    });

    if (!teacher) {
      throw new NotFoundException(`Docente con ID ${id} no encontrado`);
    }

    // Soft delete
    teacher.deleted_at = new Date();
    teacher.is_active = false;
    await this.teacherRepository.save(teacher);

    return { message: `Docente ${teacher.name} eliminado exitosamente` };
  }

  async activate(id: number): Promise<TeacherResponseDto> {
    const teacher = await this.teacherRepository.findOne({
      where: { id }
    });

    if (!teacher) {
      throw new NotFoundException(`Docente con ID ${id} no encontrado`);
    }

    teacher.is_active = true;
    teacher.deleted_at = null;
    const updatedTeacher = await this.teacherRepository.save(teacher);

    return plainToClass(TeacherResponseDto, updatedTeacher, { excludeExtraneousValues: true });
  }

  async deactivate(id: number): Promise<TeacherResponseDto> {
    const teacher = await this.teacherRepository.findOne({
      where: { id, deleted_at: null }
    });

    if (!teacher) {
      throw new NotFoundException(`Docente con ID ${id} no encontrado`);
    }

    teacher.is_active = false;
    const updatedTeacher = await this.teacherRepository.save(teacher);

    return plainToClass(TeacherResponseDto, updatedTeacher, { excludeExtraneousValues: true });
  }

  // Métodos auxiliares privados
  private validateRut(rut: string): boolean {
    if (!rut) return false;
    
    const cleanRut = rut.replace(/\./g, '').replace('-', '');
    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toLowerCase();
    
    let sum = 0;
    let multiplier = 2;
    
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const remainder = sum % 11;
    const calculatedDv = remainder < 2 ? remainder.toString() : (11 - remainder === 10 ? 'k' : (11 - remainder).toString());
    
    return dv === calculatedDv;
  }

  private normalizeRut(rut: string): string {
    // Remover puntos y mantener solo el guión
    return rut.replace(/\./g, '');
  }
}
