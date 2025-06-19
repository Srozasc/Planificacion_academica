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
import { JwtAuthGuard } from '../common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('schedules')
@UseGuards(JwtAuthGuard)
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  /**
   * GET /schedules - Obtiene eventos de programación con filtros opcionales
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
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ScheduleEventDto> {
    return this.schedulingService.findOne(id);
  }  /**
   * POST /schedules - Crea un nuevo evento de programación
   * Requiere autenticación JWT
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createEventDto: CreateEventDto,
    @Request() req: any
  ): Promise<ScheduleEventDto> {
    const userId = req.user?.userId || 1; // userId es el campo correcto del JWT
    console.log('Usuario del request:', req.user); // Debug
    console.log('UserId extraído:', userId); // Debug
    return this.schedulingService.create(createEventDto, userId);
  }
  /**
   * PUT /schedules/:id - Actualiza un evento de programación existente
   * Requiere autenticación JWT
   */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req: any
  ): Promise<ScheduleEventDto> {
    const userId = req.user?.id || req.user?.sub || req.user?.userId || 1; // Fallback a 1 si no hay userId
    return this.schedulingService.update(id, updateEventDto, userId);
  }

  /**
   * DELETE /schedules/:id - Elimina (lógicamente) un evento de programación
   * Requiere autenticación JWT
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any
  ): Promise<{ message: string }> {
    const userId = req.user?.id || req.user?.sub || req.user?.userId || 1; // Fallback a 1 si no hay userId
    return this.schedulingService.remove(id, userId);
  }

  /**
   * GET /schedules/area/:areaId - Obtiene eventos de un área específica
   * Útil para coordinadores de área
   */
  @Get('area/:areaId')
  @UseGuards(RolesGuard)
  @Roles('coordinator', 'director', 'admin')
  async findByArea(
    @Param('areaId', ParseIntPipe) areaId: number,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string
  ): Promise<ScheduleEventDto[]> {
    return this.schedulingService.findAll(areaId, startDate, endDate);
  }

  /**
   * GET /schedules/teacher/:teacherId - Obtiene eventos de un docente específico
   * Útil para ver la carga académica de un docente
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
