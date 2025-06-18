import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { CreateEventDto, UpdateEventDto, GetEventsQueryDto, ScheduleEventDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('schedules')
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  /**
   * GET /schedules - Obtiene eventos de programación con filtros opcionales
   * TEMPORALMENTE sin autenticación para pruebas
   */
  @Get()
  async findAll(@Query() query: GetEventsQueryDto): Promise<ScheduleEventDto[]> {
    return this.schedulingService.findAll(
      query.area_id,
      query.start_date,
      query.end_date,
      query.teacher_id,
      query.status_id
    );
  }

  /**
   * GET /schedules/:id - Obtiene un evento específico por ID
   * TEMPORALMENTE sin autenticación para pruebas
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ScheduleEventDto> {
    return this.schedulingService.findOne(id);
  }

  /**
   * POST /schedules - Crea un nuevo evento de programación
   * Requiere autenticación JWT
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createEventDto: CreateEventDto,
    @Request() req: any
  ): Promise<ScheduleEventDto> {
    const userId = req.user?.id || req.user?.sub || 1; // Default para pruebas
    return this.schedulingService.create(createEventDto, userId);
  }

  /**
   * PUT /schedules/:id - Actualiza un evento de programación existente
   * Requiere autenticación JWT
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req: any
  ): Promise<ScheduleEventDto> {
    const userId = req.user?.id || req.user?.sub || 1; // Default para pruebas
    return this.schedulingService.update(id, updateEventDto, userId);
  }

  /**
   * DELETE /schedules/:id - Elimina (lógicamente) un evento de programación
   * Requiere autenticación JWT
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any
  ): Promise<{ message: string }> {
    const userId = req.user?.id || req.user?.sub || 1; // Default para pruebas
    return this.schedulingService.remove(id, userId);
  }

  /**
   * GET /schedules/area/:areaId - Obtiene eventos de un área específica
   */
  @Get('area/:areaId')
  async findByArea(
    @Param('areaId', ParseIntPipe) areaId: number,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string
  ): Promise<ScheduleEventDto[]> {
    return this.schedulingService.findAll(areaId, startDate, endDate);
  }

  /**
   * GET /schedules/teacher/:teacherId - Obtiene eventos de un docente específico
   */
  @Get('teacher/:teacherId')
  async findByTeacher(
    @Param('teacherId', ParseIntPipe) teacherId: number,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string
  ): Promise<ScheduleEventDto[]> {
    return this.schedulingService.findAll(undefined, startDate, endDate, teacherId);
  }
}
