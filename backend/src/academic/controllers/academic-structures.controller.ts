import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AcademicStructuresService } from '../services/academic-structures.service';
import { CreateAcademicStructureDto } from '../dto/create-academic-structure.dto';
import { UpdateAcademicStructureDto } from '../dto/update-academic-structure.dto';
import { AcademicStructureResponseDto } from '../dto/academic-structure-response.dto';

@Controller('academic-structures')
@UseGuards(JwtAuthGuard, RolesGuard) // Habilitado para producción
@UsePipes(new ValidationPipe({ transform: true }))
export class AcademicStructuresController {
  constructor(
    private readonly academicStructuresService: AcademicStructuresService,
    @InjectDataSource() private dataSource: DataSource
  ) {}
  @Post()
  @Roles('Administrador', 'Coordinador')
  async create(@Body() createDto: CreateAcademicStructureDto): Promise<AcademicStructureResponseDto> {
    return this.academicStructuresService.create(createDto);
  }  @Get()
  @Roles('Administrador', 'Coordinador', 'Profesor')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('plan_id') plan_id?: string,
    @Query('is_active') is_active?: string
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const planIdNumber = plan_id ? parseInt(plan_id, 10) : undefined;
    const isActiveBoolean = is_active !== undefined ? is_active === 'true' : undefined;
      return this.academicStructuresService.findAll(
      pageNumber,
      limitNumber,
      search,
      type,
      planIdNumber,
      isActiveBoolean
    );  }

  @Get('plans')
  @Roles('Administrador', 'Coordinador', 'Profesor')
  async findPlans(): Promise<AcademicStructureResponseDto[]> {
    return this.academicStructuresService.findPlans();
  }
  @Get(':id')
  @Roles('Administrador', 'Coordinador', 'Profesor')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<AcademicStructureResponseDto> {
    return this.academicStructuresService.findOne(id);
  }

  @Patch(':id')
  @Roles('Administrador', 'Coordinador')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAcademicStructureDto
  ): Promise<AcademicStructureResponseDto> {
    return this.academicStructuresService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('Administrador')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.academicStructuresService.remove(id);
  }
}
