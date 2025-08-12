import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Logger,
  ValidationPipe,
  Req,
} from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { GetEventsQueryDto } from './dto/get-events-query.dto';
import { ResponseService } from '../common/services/response.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulingController {
  private readonly logger = new Logger(SchedulingController.name);

  constructor(
    private readonly schedulingService: SchedulingService,
    private readonly responseService: ResponseService,
  ) {}

  @Get()
  async findAll(
    @Query(new ValidationPipe({ transform: true })) query: GetEventsQueryDto,
    @Req() req: any
  ) {
    try {
      const userId = req.user.userId;
      const result = await this.schedulingService.findAllWithPermissions(query, userId);
        // Convertir al formato esperado por el frontend
      const frontendEvents = result.data.map(event => event.toFrontendFormat());
      
      return this.responseService.paginated(
        frontendEvents,
        result.total,
        {
          page: query.page || 1,
          limit: query.limit || 50,
        },
        `${result.data.length} eventos obtenidos exitosamente`
      );
    } catch (error) {
      this.logger.error('Error al obtener eventos', error);
      return this.responseService.error(
        'Error al obtener eventos',
        [error.message]
      );
    }
  }

  @Get('stats')
  async getStats() {
    try {
      const stats = await this.schedulingService.getEventStats();
      return this.responseService.success(
        stats,
        'Estadísticas de eventos obtenidas exitosamente'
      );
    } catch (error) {
      this.logger.error('Error al obtener estadísticas', error);
      return this.responseService.error(
        'Error al obtener estadísticas',
        [error.message]
      );
    }
  }

  @Get('bimestre/:bimestreId')
  async findByBimestre(
    @Param('bimestreId', ParseIntPipe) bimestreId: number,
    @Req() req: any
  ) {
    try {
      const userId = req.user.userId;
      const events = await this.schedulingService.findByBimestreWithPermissions(bimestreId, userId);
      const frontendEvents = events.map(event => event.toFrontendFormat());
      
      return this.responseService.success(
        frontendEvents,
        `Eventos del bimestre ${bimestreId} obtenidos exitosamente`
      );
    } catch (error) {
      this.logger.error(`Error al obtener eventos del bimestre ${bimestreId}`, error);
      return this.responseService.error(
        'Error al obtener eventos del bimestre',
        [error.message]
      );
    }
  }

  @Get('adol/bimestre/:bimestreId')
  async findADOLByBimestre(
    @Param('bimestreId', ParseIntPipe) bimestreId: number,
    @Req() req: any
  ) {
    try {
      const userEmail = req.user.email;
      const events = await this.schedulingService.findADOLEventsByBimestre(bimestreId, userEmail);
      const frontendEvents = events.map(event => event.toFrontendFormat());
      
      return this.responseService.success(
        frontendEvents,
        `Eventos ADOL del bimestre ${bimestreId} obtenidos exitosamente`
      );
    } catch (error) {
      this.logger.error(`Error al obtener eventos ADOL del bimestre ${bimestreId}`, error);
      return this.responseService.error(
        'Error al obtener eventos ADOL del bimestre',
        [error.message]
      );
    }
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    try {
      const event = await this.schedulingService.findById(id);
      return this.responseService.success(
        event.toFrontendFormat(),
        'Evento obtenido exitosamente'
      );
    } catch (error) {
      this.logger.error(`Error al obtener evento ${id}`, error);
      return this.responseService.error(
        'Error al obtener evento',
        [error.message]
      );
    }
  }

  @Post()
  @Roles('Maestro', 'Editor')
  async create(@Body() createEventDto: CreateEventDto, @Req() req: any) {
    try {
      const userEmail = req.user.email;
      const event = await this.schedulingService.create(createEventDto, userEmail);
      return this.responseService.success(
        event.toFrontendFormat(),
        'Evento creado exitosamente'
      );
    } catch (error) {
      this.logger.error('Error al crear evento', error);
      throw error; // Re-lanzar la excepción para que NestJS la maneje correctamente
    }
  }

  @Put(':id')
  @Roles('Maestro', 'Editor')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventDto: UpdateEventDto,
    @Req() req: any
  ) {
    try {
      const userEmail = req.user.email;
      const event = await this.schedulingService.update(id, updateEventDto, userEmail);
      return this.responseService.success(
        event.toFrontendFormat(),
        'Evento actualizado exitosamente'
      );
    } catch (error) {
      this.logger.error(`Error al actualizar evento ${id}`, error);
      throw error; // Re-lanzar la excepción para que NestJS la maneje correctamente
    }
  }

  @Delete(':id')
  @Roles('Maestro')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.schedulingService.remove(id);
      return this.responseService.success(
        null,
        'Evento eliminado exitosamente'
      );
    } catch (error) {
      this.logger.error(`Error al eliminar evento ${id}`, error);
      throw error; // Re-lanzar la excepción para que NestJS la maneje correctamente
    }
  }

  @Patch(':id/deactivate')
  @Roles('Maestro', 'Editor')
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    try {
      const event = await this.schedulingService.deactivate(id);
      return this.responseService.success(
        event.toFrontendFormat(),
        'Evento desactivado exitosamente'
      );
    } catch (error) {
      this.logger.error(`Error al desactivar evento ${id}`, error);
      throw error; // Re-lanzar la excepción para que NestJS la maneje correctamente
    }
  }
}
