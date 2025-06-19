import { 
  Injectable, 
  BadRequestException, 
  UnprocessableEntityException, 
  NotFoundException, 
  InternalServerErrorException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { CreateEventDto, UpdateEventDto, ScheduleEventDto } from './dto';
import { RowDataPacket } from 'mysql2/promise';
import { SchedulingGateway } from './scheduling.gateway';
import { DatabaseService, ResponseService, ILogger } from '../common';

/**
 * SchedulingService - Servicio de programación académica
 * 
 * Utiliza servicios del CommonModule:
 * - DatabaseService: Para operaciones de base de datos y stored procedures
 * - ResponseService: Para respuestas estandarizadas (si es necesario)
 * - ILogger: Para logging estructurado
 */
@Injectable()
export class SchedulingService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly responseService: ResponseService,
    @Inject('LOGGER') private readonly logger: ILogger,
    @Inject(forwardRef(() => SchedulingGateway))
    private readonly schedulingGateway: SchedulingGateway,
  ) {}

  /**
   * Obtiene eventos de programación con filtros opcionales
   */  async findAll(
    areaId?: number,
    startDate?: string,
    endDate?: string,
    teacherId?: number,
    statusId?: number,
  ): Promise<ScheduleEventDto[]> {
    try {
      this.logger.debug(
        `Finding events with filters: areaId=${areaId}, startDate=${startDate}, endDate=${endDate}, teacherId=${teacherId}, statusId=${statusId}`,
        'SchedulingService'
      );

      // Usar DatabaseService para ejecutar el stored procedure
      const result = await this.databaseService.executeStoredProcedure(
        'sp_GetScheduleEvents',
        [
          areaId ?? null,
          startDate ?? null,
          endDate ?? null,
          teacherId ?? null,
          statusId ?? null
        ]
      );

      if (result.status_code === 'ERROR') {
        this.logger.error(
          `Failed to get events: ${result.error_message}`,
          undefined,
          'SchedulingService'
        );
        throw new InternalServerErrorException(result.error_message || 'Error al obtener eventos de programación');
      }

      const events = result.data || [];
      this.logger.debug(`Found ${events.length} events`, 'SchedulingService');
      
      return events as ScheduleEventDto[];
    } catch (error) {
      this.logger.error(
        `Error in findAll: ${error.message}`,
        error.stack,
        'SchedulingService'
      );
      
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al obtener eventos de programación');
    }
  }  /**
   * Crea un nuevo evento de programación
   */
  async create(createEventDto: CreateEventDto, userId: number): Promise<ScheduleEventDto> {
    try {
      // Validar que userId no sea undefined
      if (!userId) {
        throw new BadRequestException('Usuario no identificado');
      }

      this.logger.debug(
        `Creating event for user ${userId}: ${JSON.stringify(createEventDto)}`,
        'SchedulingService'
      );

      // Usar DatabaseService para ejecutar el stored procedure
      const result = await this.databaseService.executeStoredProcedure(
        'sp_ValidateAndSaveScheduleEvent',
        [JSON.stringify(createEventDto), userId]
      );

      if (result.status_code === 'VALIDATION_ERROR') {
        this.logger.warn(
          `Validation error creating event: ${result.error_message}`,
          'SchedulingService'
        );
        throw new BadRequestException(result.error_message);
      }

      if (result.status_code === 'ERROR') {
        this.logger.error(
          `Error creating event: ${result.error_message}`,
          undefined,
          'SchedulingService'
        );
        throw new UnprocessableEntityException(result.error_message);
      }

      if (result.status_code === 'SUCCESS' && result.data) {
        // Si el SP retorna directamente el evento creado
        const createdEvent = Array.isArray(result.data) ? result.data[0] : result.data;
        
        if (createdEvent) {
          this.logger.debug(
            `Event created successfully with ID: ${createdEvent.id}`,
            'SchedulingService'
          );

          // Emitir evento WebSocket
          this.schedulingGateway.emitEventCreated(createEventDto.area_id, createdEvent as ScheduleEventDto);
          return createdEvent as ScheduleEventDto;
        }
      }

      // Si no tenemos el evento creado, intentamos obtenerlo
      // (Esto puede ser necesario dependiendo de cómo esté implementado el SP)
      throw new InternalServerErrorException('Evento creado pero no se pudo recuperar la información');

    } catch (error) {
      if (error instanceof BadRequestException || 
          error instanceof UnprocessableEntityException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      this.logger.error(
        `Unexpected error in create: ${error.message}`,
        error.stack,
        'SchedulingService'
      );
      throw new InternalServerErrorException('Error al crear evento de programación');
    }
  }  /**
   * Actualiza un evento de programación existente
   * 
   * NOTA TÉCNICA: El SP sp_ValidateAndSaveScheduleEvent no soporta actualizaciones
   * directas vía parámetros OUT. Se usa una aproximación alternativa con múltiples
   * consultas para mantener la lógica de negocio del SP.
   */
  async update(eventId: number, updateEventDto: UpdateEventDto, userId: number): Promise<ScheduleEventDto> {
    try {
      // Validar que userId no sea undefined
      if (!userId) {
        throw new BadRequestException('Usuario no identificado');
      }

      this.logger.debug(
        `Updating event ${eventId} for user ${userId}: ${JSON.stringify(updateEventDto)}`,
        'SchedulingService'
      );      // Verificar que el evento existe usando DatabaseService
      const existingEvents = await this.databaseService.query(
        'SELECT * FROM schedule_events WHERE id = ? AND is_active = TRUE',
        [eventId]
      );

      if (!existingEvents || existingEvents.length === 0) {
        throw new NotFoundException('Evento no encontrado');
      }

      const existingEvent = existingEvents[0];

      // Preparar datos para actualización (incluir ID para update)
      const updateData = {
        id: eventId,
        ...updateEventDto
      };      // WORKAROUND: Usar query para manejar variables de sesión del SP
      // ya que el SP no retorna directamente el resultado via parámetros
      try {
        await this.databaseService.query(
          'CALL sp_ValidateAndSaveScheduleEvent(?, ?, @event_id, @status_code, @error_message)',
          [JSON.stringify(updateData), userId]
        );

        // Obtener variables de salida
        const outputResults = await this.databaseService.query(
          'SELECT @event_id as event_id, @status_code as status_code, @error_message as error_message'
        );
        
        if (!outputResults || outputResults.length === 0) {
          throw new InternalServerErrorException('Error al obtener respuesta del stored procedure');
        }

        const output = outputResults[0];

        if (output.status_code === 'SUCCESS') {
          // Obtener el evento actualizado usando el método findAll
          const events = await this.findAll();
          const updatedEvent = events.find((event: ScheduleEventDto) => event.id === eventId);

          if (updatedEvent) {
            this.logger.debug(
              `Event ${eventId} updated successfully`,
              'SchedulingService'
            );

            // Emitir evento WebSocket
            this.schedulingGateway.emitEventCreated(
              updateEventDto.area_id || existingEvent.area_id, 
              updatedEvent
            );
            return updatedEvent;
          } else {
            throw new InternalServerErrorException('Error al recuperar el evento actualizado');
          }
        } else if (output.status_code === 'VALIDATION_ERROR') {
          this.logger.warn(
            `Validation error updating event ${eventId}: ${output.error_message}`,
            'SchedulingService'
          );
          throw new BadRequestException(output.error_message);
        } else {
          this.logger.error(
            `Error updating event ${eventId}: ${output.error_message}`,
            undefined,
            'SchedulingService'
          );
          throw new UnprocessableEntityException(output.error_message);
        }
      } catch (dbError) {
        this.logger.error(
          `Database error updating event ${eventId}: ${dbError.message}`,
          dbError.stack,
          'SchedulingService'
        );
        throw new InternalServerErrorException('Error de base de datos al actualizar evento');
      }
    } catch (error) {
      if (error instanceof BadRequestException || 
          error instanceof UnprocessableEntityException || 
          error instanceof NotFoundException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      this.logger.error(
        `Unexpected error updating event ${eventId}: ${error.message}`,
        error.stack,
        'SchedulingService'
      );
      throw new InternalServerErrorException('Error al actualizar evento de programación');
    }
  }  /**
   * Elimina (lógicamente) un evento de programación
   */
  async remove(eventId: number, userId: number): Promise<{ message: string }> {
    try {
      // Validar que userId no sea undefined
      if (!userId) {
        throw new BadRequestException('Usuario no identificado');
      }

      this.logger.debug(
        `Removing event ${eventId} for user ${userId}`,
        'SchedulingService'
      );

      // Obtener información del evento antes de eliminarlo (para WebSocket)
      const existingEvents = await this.databaseService.query(
        'SELECT area_id FROM schedule_events WHERE id = ? AND is_active = TRUE',
        [eventId]
      );

      if (!existingEvents || existingEvents.length === 0) {
        throw new NotFoundException('Evento no encontrado');
      }

      const areaId = existingEvents[0].area_id;

      // Llamar al stored procedure de eliminación usando query
      await this.databaseService.query(
        'CALL sp_DeleteScheduleEvent(?, ?, ?, @status_code, @error_message)',
        [eventId, userId, true] // true = eliminación lógica
      );

      // Obtener variables de salida
      const outputResults = await this.databaseService.query(
        'SELECT @status_code as status_code, @error_message as error_message'
      );
      
      if (!outputResults || outputResults.length === 0) {
        throw new InternalServerErrorException('Error al obtener respuesta del stored procedure');
      }

      const output = outputResults[0];

      if (output.status_code === 'SUCCESS') {
        this.logger.debug(
          `Event ${eventId} removed successfully`,
          'SchedulingService'
        );

        // Emitir evento WebSocket
        this.schedulingGateway.emitEventDeleted(areaId, eventId);
        return { message: output.error_message || 'Evento eliminado exitosamente' };
      } else if (output.status_code === 'NOT_FOUND') {
        throw new NotFoundException(output.error_message);
      } else {
        this.logger.error(
          `Error removing event ${eventId}: ${output.error_message}`,
          undefined,
          'SchedulingService'
        );
        throw new InternalServerErrorException(output.error_message);
      }
    } catch (error) {
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException ||
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      this.logger.error(
        `Unexpected error removing event ${eventId}: ${error.message}`,
        error.stack,
        'SchedulingService'
      );
      throw new InternalServerErrorException('Error al eliminar evento de programación');
    }
  }  /**
   * Obtiene un evento específico por ID
   */
  async findOne(eventId: number): Promise<ScheduleEventDto> {
    try {
      this.logger.debug(
        `Finding event with ID: ${eventId}`,
        'SchedulingService'
      );

      // Usar el método findAll y filtrar por ID
      // Esto es más eficiente que ejecutar un SP separado
      const events = await this.findAll();
      const event = events.find((event: ScheduleEventDto) => event.id === eventId);

      if (!event) {
        throw new NotFoundException('Evento no encontrado');
      }

      this.logger.debug(
        `Found event with ID: ${eventId}`,
        'SchedulingService'
      );

      return event;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(
        `Error finding event ${eventId}: ${error.message}`,
        error.stack,
        'SchedulingService'
      );
      throw new InternalServerErrorException('Error al obtener evento de programación');
    }
  }
}
