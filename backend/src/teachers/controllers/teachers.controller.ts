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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { TeachersService } from '../services/teachers.service';
import { CreateTeacherDto } from '../dto/create-teacher.dto';
import { UpdateTeacherDto } from '../dto/update-teacher.dto';
import { TeacherResponseDto } from '../dto/teacher-response.dto';

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @Roles('Administrador', 'Coordinador')
  async create(@Body() createDto: CreateTeacherDto): Promise<TeacherResponseDto> {
    return this.teachersService.create(createDto);
  }

  @Get()
  @Roles('Administrador', 'Coordinador', 'Profesor')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('is_active') is_active?: string,
    @Query('can_coordinate') can_coordinate?: string,
    @Query('category_id') category_id?: string,
    @Query('contract_type_id') contract_type_id?: string
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const isActiveBoolean = is_active !== undefined ? is_active === 'true' : undefined;
    const canCoordinateBoolean = can_coordinate !== undefined ? can_coordinate === 'true' : undefined;
    const categoryIdNumber = category_id ? parseInt(category_id, 10) : undefined;
    const contractTypeIdNumber = contract_type_id ? parseInt(contract_type_id, 10) : undefined;

    return this.teachersService.findAll(
      pageNumber,
      limitNumber,
      search,
      isActiveBoolean,
      canCoordinateBoolean,
      categoryIdNumber,
      contractTypeIdNumber
    );
  }

  @Get('active')
  @Roles('Administrador', 'Coordinador', 'Profesor')
  async findActiveTeachers(): Promise<TeacherResponseDto[]> {
    return this.teachersService.findActiveTeachers();
  }

  @Get('coordinators')
  @Roles('Administrador', 'Coordinador')
  async findCoordinators(): Promise<TeacherResponseDto[]> {
    return this.teachersService.findCoordinators();
  }

  @Get('rut/:rut')
  @Roles('Administrador', 'Coordinador', 'Profesor')
  async findByRut(@Param('rut') rut: string): Promise<TeacherResponseDto> {
    return this.teachersService.findByRut(rut);
  }

  @Get('email/:email')
  @Roles('Administrador', 'Coordinador')
  async findByEmail(@Param('email') email: string): Promise<TeacherResponseDto> {
    return this.teachersService.findByEmail(email);
  }

  @Get(':id')
  @Roles('Administrador', 'Coordinador', 'Profesor')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<TeacherResponseDto> {
    return this.teachersService.findOne(id);
  }

  @Patch(':id')
  @Roles('Administrador', 'Coordinador')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTeacherDto
  ): Promise<TeacherResponseDto> {
    return this.teachersService.update(id, updateDto);
  }

  @Patch(':id/activate')
  @Roles('Administrador')
  async activate(@Param('id', ParseIntPipe) id: number): Promise<TeacherResponseDto> {
    return this.teachersService.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles('Administrador')
  async deactivate(@Param('id', ParseIntPipe) id: number): Promise<TeacherResponseDto> {
    return this.teachersService.deactivate(id);
  }

  @Delete(':id')
  @Roles('Administrador')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.teachersService.remove(id);
  }
}
