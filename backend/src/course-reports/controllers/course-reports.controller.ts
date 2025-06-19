import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Req
} from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles } from '../../common';
import { CourseReportsService } from '../services/course-reports.service';
import { CreateCourseReportDataDto } from '../dto/create-course-report-data.dto';
import { UpdateCourseReportDataDto } from '../dto/update-course-report-data.dto';
import { CourseReportDataResponseDto } from '../dto/course-report-data-response.dto';
import { CourseTerm, CourseModality } from '../entities/course-report-data.entity';

@Controller('course-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourseReportsController {
  constructor(private readonly courseReportsService: CourseReportsService) {}

  @Post()
  @Roles('Administrador', 'Director/Jefe de Programa')
  async create(@Body() createDto: CreateCourseReportDataDto): Promise<CourseReportDataResponseDto> {
    return await this.courseReportsService.create(createDto);
  }

  @Get()
  @Roles('Administrador', 'Director/Jefe de Programa', 'Usuario Lector')
  async findAll(
    @Query('year') year?: number,
    @Query('term') term?: CourseTerm,
    @Query('modality') modality?: CourseModality,
    @Query('academic_structure_id') academicStructureId?: number,
    @Query('is_validated') isValidated?: string,
    @Query('section') section?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ) {
    const filters = {
      ...(year && { year: Number(year) }),
      ...(term && { term }),
      ...(modality && { modality }),
      ...(academicStructureId && { academic_structure_id: Number(academicStructureId) }),
      ...(isValidated !== undefined && { is_validated: isValidated === 'true' }),
      ...(section && { section })
    };

    const pagination = {
      page: Number(page),
      limit: Number(limit)
    };

    return await this.courseReportsService.findAll(filters, pagination);
  }

  @Get('period/:year/:term')
  @Roles('Administrador', 'Director/Jefe de Programa', 'Usuario Lector')
  async findByPeriod(
    @Param('year', ParseIntPipe) year: number,
    @Param('term') term: CourseTerm
  ): Promise<CourseReportDataResponseDto[]> {
    return await this.courseReportsService.findByPeriod(year, term);
  }

  @Get('academic-structure/:id')
  @Roles('Administrador', 'Director/Jefe de Programa', 'Usuario Lector')
  async findByAcademicStructure(
    @Param('id', ParseIntPipe) academicStructureId: number
  ): Promise<CourseReportDataResponseDto[]> {
    return await this.courseReportsService.findByAcademicStructure(academicStructureId);
  }

  @Get('pending-validation')
  @Roles('Administrador', 'Director/Jefe de Programa')
  async findPendingValidation(): Promise<CourseReportDataResponseDto[]> {
    return await this.courseReportsService.findPendingValidation();
  }

  @Get('statistics/period/:year')
  @Roles('Administrador', 'Director/Jefe de Programa', 'Usuario Lector')
  async getStatisticsByPeriod(
    @Param('year', ParseIntPipe) year: number,
    @Query('term') term?: CourseTerm
  ) {
    return await this.courseReportsService.getStatisticsByPeriod(year, term);
  }

  @Get(':id')
  @Roles('Administrador', 'Director/Jefe de Programa', 'Usuario Lector')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CourseReportDataResponseDto> {
    return await this.courseReportsService.findOne(id);
  }

  @Patch(':id')
  @Roles('Administrador', 'Director/Jefe de Programa')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCourseReportDataDto
  ): Promise<CourseReportDataResponseDto> {
    return await this.courseReportsService.update(id, updateDto);
  }

  @Patch(':id/validate')
  @Roles('Administrador', 'Director/Jefe de Programa')
  async validate(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any
  ): Promise<CourseReportDataResponseDto> {
    const validatorId = req.user.userId;
    return await this.courseReportsService.validate(id, validatorId);
  }

  @Patch(':id/invalidate')
  @Roles('Administrador', 'Director/Jefe de Programa')
  async invalidate(
    @Param('id', ParseIntPipe) id: number
  ): Promise<CourseReportDataResponseDto> {
    return await this.courseReportsService.invalidate(id);
  }

  @Delete(':id')
  @Roles('Administrador')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.courseReportsService.remove(id);
  }
}
