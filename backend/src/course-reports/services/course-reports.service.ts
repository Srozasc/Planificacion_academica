import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Between } from 'typeorm';
import { CourseReportData, CourseTerm, CourseModality } from '../entities/course-report-data.entity';
import { CreateCourseReportDataDto } from '../dto/create-course-report-data.dto';
import { UpdateCourseReportDataDto } from '../dto/update-course-report-data.dto';
import { CourseReportDataResponseDto } from '../dto/course-report-data-response.dto';
import { plainToClass } from 'class-transformer';

export interface CourseReportFilters {
  year?: number;
  term?: CourseTerm;
  modality?: CourseModality;
  academic_structure_id?: number;
  is_validated?: boolean;
  section?: string;
}

export interface CourseReportPagination {
  page?: number;
  limit?: number;
}

@Injectable()
export class CourseReportsService {
  constructor(
    @InjectRepository(CourseReportData)
    private courseReportRepository: Repository<CourseReportData>,
  ) {}

  async create(createDto: CreateCourseReportDataDto): Promise<CourseReportDataResponseDto> {
    // Verificar que no exista un reporte duplicado
    const existing = await this.courseReportRepository.findOne({
      where: {
        academic_structure_id: createDto.academic_structure_id,
        year: createDto.year,
        term: createDto.term,
        section: createDto.section || null,
        deleted_at: null
      }
    });

    if (existing) {
      throw new BadRequestException(
        `Ya existe un reporte para esta asignatura en el período ${createDto.term} ${createDto.year}${createDto.section ? ` sección ${createDto.section}` : ''}`
      );
    }

    // Validar consistencia de datos si se proporcionan
    this.validateDataConsistency(createDto);

    const courseReport = this.courseReportRepository.create(createDto);
    const saved = await this.courseReportRepository.save(courseReport);
    
    return await this.findOne(saved.id);
  }

  async findAll(
    filters: CourseReportFilters = {},
    pagination: CourseReportPagination = {}
  ): Promise<{
    data: CourseReportDataResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const queryBuilder = this.courseReportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.academic_structure', 'structure')
      .leftJoinAndSelect('report.validator', 'validator')
      .where('report.deleted_at IS NULL');

    // Aplicar filtros
    if (filters.year) {
      queryBuilder.andWhere('report.year = :year', { year: filters.year });
    }

    if (filters.term) {
      queryBuilder.andWhere('report.term = :term', { term: filters.term });
    }

    if (filters.modality) {
      queryBuilder.andWhere('report.modality = :modality', { modality: filters.modality });
    }

    if (filters.academic_structure_id) {
      queryBuilder.andWhere('report.academic_structure_id = :structureId', { 
        structureId: filters.academic_structure_id 
      });
    }

    if (filters.is_validated !== undefined) {
      queryBuilder.andWhere('report.is_validated = :isValidated', { 
        isValidated: filters.is_validated 
      });
    }

    if (filters.section) {
      queryBuilder.andWhere('report.section = :section', { section: filters.section });
    }

    // Ordenar por año, término y estructura académica
    queryBuilder
      .orderBy('report.year', 'DESC')
      .addOrderBy('report.term', 'ASC')
      .addOrderBy('structure.name', 'ASC')
      .addOrderBy('report.section', 'ASC');

    const [reports, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const data = reports.map(report => 
      plainToClass(CourseReportDataResponseDto, report, { excludeExtraneousValues: true })
    );

    return {
      data,
      total,
      page,
      limit
    };
  }

  async findOne(id: number): Promise<CourseReportDataResponseDto> {
    const report = await this.courseReportRepository.findOne({
      where: { id, deleted_at: null },
      relations: ['academic_structure', 'validator']
    });

    if (!report) {
      throw new NotFoundException(`Reporte de curso con ID ${id} no encontrado`);
    }

    return plainToClass(CourseReportDataResponseDto, report, { excludeExtraneousValues: true });
  }

  async findByPeriod(year: number, term: CourseTerm): Promise<CourseReportDataResponseDto[]> {
    const reports = await this.courseReportRepository.find({
      where: { year, term, deleted_at: null },
      relations: ['academic_structure', 'validator'],
      order: { academic_structure: { name: 'ASC' }, section: 'ASC' }
    });

    return reports.map(report => 
      plainToClass(CourseReportDataResponseDto, report, { excludeExtraneousValues: true })
    );
  }

  async findByAcademicStructure(academicStructureId: number): Promise<CourseReportDataResponseDto[]> {
    const reports = await this.courseReportRepository.find({
      where: { academic_structure_id: academicStructureId, deleted_at: null },
      relations: ['academic_structure', 'validator'],
      order: { year: 'DESC', term: 'ASC', section: 'ASC' }
    });

    return reports.map(report => 
      plainToClass(CourseReportDataResponseDto, report, { excludeExtraneousValues: true })
    );
  }

  async findPendingValidation(): Promise<CourseReportDataResponseDto[]> {
    const reports = await this.courseReportRepository.find({
      where: { is_validated: false, deleted_at: null },
      relations: ['academic_structure', 'validator'],
      order: { created_at: 'ASC' }
    });

    return reports.map(report => 
      plainToClass(CourseReportDataResponseDto, report, { excludeExtraneousValues: true })
    );
  }

  async getStatisticsByPeriod(year: number, term?: CourseTerm): Promise<{
    total_courses: number;
    total_students: number;
    total_enrolled: number;
    total_passed: number;
    total_failed: number;
    total_withdrawn: number;
    average_approval_rate: number;
    average_retention_rate: number;
  }> {
    const queryBuilder = this.courseReportRepository
      .createQueryBuilder('report')
      .where('report.year = :year', { year })
      .andWhere('report.deleted_at IS NULL');

    if (term) {
      queryBuilder.andWhere('report.term = :term', { term });
    }

    const reports = await queryBuilder.getMany();

    const stats = {
      total_courses: reports.length,
      total_students: reports.reduce((sum, r) => sum + (r.student_count || 0), 0),
      total_enrolled: reports.reduce((sum, r) => sum + (r.enrolled_count || 0), 0),
      total_passed: reports.reduce((sum, r) => sum + (r.passed_count || 0), 0),
      total_failed: reports.reduce((sum, r) => sum + (r.failed_count || 0), 0),
      total_withdrawn: reports.reduce((sum, r) => sum + (r.withdrawn_count || 0), 0),
      average_approval_rate: 0,
      average_retention_rate: 0
    };

    // Calcular promedios
    const validReports = reports.filter(r => r.enrolled_count && r.passed_count !== null);
    if (validReports.length > 0) {
      const approvalRates = validReports.map(r => (r.passed_count / r.enrolled_count) * 100);
      stats.average_approval_rate = Math.round(
        (approvalRates.reduce((sum, rate) => sum + rate, 0) / approvalRates.length) * 100
      ) / 100;

      const retentionReports = validReports.filter(r => r.withdrawn_count !== null);
      if (retentionReports.length > 0) {
        const retentionRates = retentionReports.map(r => 
          ((r.enrolled_count - r.withdrawn_count) / r.enrolled_count) * 100
        );
        stats.average_retention_rate = Math.round(
          (retentionRates.reduce((sum, rate) => sum + rate, 0) / retentionRates.length) * 100
        ) / 100;
      }
    }

    return stats;
  }

  async update(id: number, updateDto: UpdateCourseReportDataDto): Promise<CourseReportDataResponseDto> {
    const report = await this.courseReportRepository.findOne({
      where: { id, deleted_at: null }
    });

    if (!report) {
      throw new NotFoundException(`Reporte de curso con ID ${id} no encontrado`);
    }    // Validar consistencia de datos si se actualizan
    const updateData = {
      academic_structure_id: updateDto.academic_structure_id || report.academic_structure_id,
      student_count: updateDto.student_count !== undefined ? updateDto.student_count : report.student_count,
      enrolled_count: updateDto.enrolled_count !== undefined ? updateDto.enrolled_count : report.enrolled_count,
      passed_count: updateDto.passed_count !== undefined ? updateDto.passed_count : report.passed_count,
      failed_count: updateDto.failed_count !== undefined ? updateDto.failed_count : report.failed_count,
      withdrawn_count: updateDto.withdrawn_count !== undefined ? updateDto.withdrawn_count : report.withdrawn_count,
      weekly_hours: updateDto.weekly_hours !== undefined ? updateDto.weekly_hours : report.weekly_hours,
      total_hours: updateDto.total_hours !== undefined ? updateDto.total_hours : report.total_hours,
    };
    
    this.validateDataConsistency(updateData);

    Object.assign(report, updateDto);
    await this.courseReportRepository.save(report);
    
    return await this.findOne(id);
  }

  async validate(id: number, validatorId: number): Promise<CourseReportDataResponseDto> {
    const report = await this.courseReportRepository.findOne({
      where: { id, deleted_at: null }
    });

    if (!report) {
      throw new NotFoundException(`Reporte de curso con ID ${id} no encontrado`);
    }

    report.is_validated = true;
    report.validated_by = validatorId;
    report.validated_at = new Date();

    await this.courseReportRepository.save(report);
    
    return await this.findOne(id);
  }

  async invalidate(id: number): Promise<CourseReportDataResponseDto> {
    const report = await this.courseReportRepository.findOne({
      where: { id, deleted_at: null }
    });

    if (!report) {
      throw new NotFoundException(`Reporte de curso con ID ${id} no encontrado`);
    }

    report.is_validated = false;
    report.validated_by = null;
    report.validated_at = null;

    await this.courseReportRepository.save(report);
    
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const report = await this.courseReportRepository.findOne({
      where: { id, deleted_at: null }
    });

    if (!report) {
      throw new NotFoundException(`Reporte de curso con ID ${id} no encontrado`);
    }

    // Soft delete
    report.deleted_at = new Date();
    await this.courseReportRepository.save(report);
  }

  private validateDataConsistency(data: Partial<CreateCourseReportDataDto | UpdateCourseReportDataDto>): void {
    if (data.enrolled_count && data.passed_count !== undefined && data.failed_count !== undefined && data.withdrawn_count !== undefined) {
      const total = (data.passed_count || 0) + (data.failed_count || 0) + (data.withdrawn_count || 0);
      if (total > data.enrolled_count) {
        throw new BadRequestException(
          'La suma de aprobados, reprobados y retirados no puede ser mayor a los matriculados'
        );
      }
    }

    if (data.student_count !== undefined && data.student_count < 0) {
      throw new BadRequestException('La cantidad de estudiantes cursables no puede ser negativa');
    }

    if (data.weekly_hours && data.total_hours) {
      // Verificación básica de consistencia entre horas semanales y totales
      const minExpected = data.weekly_hours * 10; // Mínimo 10 semanas
      const maxExpected = data.weekly_hours * 20; // Máximo 20 semanas
      
      if (data.total_hours < minExpected || data.total_hours > maxExpected) {
        throw new BadRequestException(
          'Las horas totales no son consistentes con las horas semanales (debe estar entre 10-20 semanas)'
        );
      }
    }
  }
}
