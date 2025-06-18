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
import { Pool, RowDataPacket } from 'mysql2/promise';
import { SchedulingGateway } from './scheduling.gateway';

@Injectable()
export class SchedulingService {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: Pool,
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
      const connection = await this.db.getConnection();
      
      try {
        // Asegurar que los parámetros no sean undefined
        const params = [
          areaId ?? null,
          startDate ?? null,
          endDate ?? null,
          teacherId ?? null,
          statusId ?? null
        ];
        
        const [results] = await connection.execute(
          'CALL sp_GetScheduleEvents(?, ?, ?, ?, ?)',
          params
        );

        // Los resultados vienen en el primer elemento del array
        const events = Array.isArray(results) && Array.isArray(results[0]) ? results[0] : [];
        
        return events as ScheduleEventDto[];
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error en findAll:', error);
      throw new InternalServerErrorException('Error al obtener eventos de programación');
    }
  }
  /**
   * Crea un nuevo evento de programación
   */
  async create(createEventDto: CreateEventDto, userId: number): Promise<ScheduleEventDto> {
    try {
      // Validar que userId no sea undefined
      if (!userId) {
        throw new BadRequestException('Usuario no identificado');
      }

      const connection = await this.db.getConnection();
      
      try {
        // Llamar al stored procedure con formato JSON
        await connection.execute(
          'CALL sp_ValidateAndSaveScheduleEvent(?, ?, @event_id, @status_code, @error_message)',
          [JSON.stringify(createEventDto), userId]
        );

        // Obtener variables de salida
        const [outputResults] = await connection.execute(
          'SELECT @event_id as event_id, @status_code as status_code, @error_message as error_message'
        ) as [RowDataPacket[], any];
        
        const output = outputResults[0];        if (output.status_code === 'SUCCESS') {
          // Obtener el evento creado
          const [eventResults] = await connection.execute(
            'CALL sp_GetScheduleEvents(?, ?, ?, ?, ?)',
            [null, null, null, null, null]
          );
          
          const events = Array.isArray(eventResults) && Array.isArray(eventResults[0]) ? eventResults[0] : [];
          const eventsArray = events as RowDataPacket[];
          const createdEvent = eventsArray.find((event: any) => event.id === output.event_id);          if (createdEvent) {
            // Emitir evento WebSocket
            this.schedulingGateway.emitEventCreated(createEventDto.area_id, createdEvent as ScheduleEventDto);
            return createdEvent as ScheduleEventDto;
          } else {
            throw new InternalServerErrorException('Error al recuperar el evento creado');
          }
        } else if (output.status_code === 'VALIDATION_ERROR') {
          throw new BadRequestException(output.error_message);
        } else {
          throw new UnprocessableEntityException(output.error_message);
        }
      } finally {
        connection.release();
      }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof UnprocessableEntityException) {
        throw error;
      }
      console.error('Error en create:', error);
      throw new InternalServerErrorException('Error al crear evento de programación');
    }
  }
  /**
   * Actualiza un evento de programación existente
   */
  async update(eventId: number, updateEventDto: UpdateEventDto, userId: number): Promise<ScheduleEventDto> {
    try {
      // Validar que userId no sea undefined
      if (!userId) {
        throw new BadRequestException('Usuario no identificado');
      }

      const connection = await this.db.getConnection();
      
      try {
        // Verificar que el evento existe
        const [existingEvents] = await connection.execute(
          'SELECT * FROM schedule_events WHERE id = ? AND is_active = TRUE',
          [eventId]
        ) as [RowDataPacket[], any];

        if (!Array.isArray(existingEvents) || existingEvents.length === 0) {
          throw new NotFoundException('Evento no encontrado');
        }

        const existingEvent = existingEvents[0];

        // Preparar datos para actualización (incluir ID para update)
        const updateData = {
          id: eventId,
          ...updateEventDto
        };

        // Llamar al stored procedure
        await connection.execute(
          'CALL sp_ValidateAndSaveScheduleEvent(?, ?, @event_id, @status_code, @error_message)',
          [JSON.stringify(updateData), userId]
        );

        // Obtener variables de salida
        const [outputResults] = await connection.execute(
          'SELECT @event_id as event_id, @status_code as status_code, @error_message as error_message'
        ) as [RowDataPacket[], any];
        
        const output = outputResults[0];        if (output.status_code === 'SUCCESS') {
          // Obtener el evento actualizado
          const [eventResults] = await connection.execute(
            'CALL sp_GetScheduleEvents(?, ?, ?, ?, ?)',
            [null, null, null, null, null]
          );
          
          const events = Array.isArray(eventResults) && Array.isArray(eventResults[0]) ? eventResults[0] : [];
          const eventsArray = events as RowDataPacket[];
          const updatedEvent = eventsArray.find((event: any) => event.id === eventId);          if (updatedEvent) {
            // Emitir evento WebSocket
            this.schedulingGateway.emitEventCreated(updateEventDto.area_id || existingEvent.area_id, updatedEvent as ScheduleEventDto);
            return updatedEvent as ScheduleEventDto;
          } else {
            throw new InternalServerErrorException('Error al recuperar el evento actualizado');
          }
        } else if (output.status_code === 'VALIDATION_ERROR') {
          throw new BadRequestException(output.error_message);
        } else {
          throw new UnprocessableEntityException(output.error_message);
        }
      } finally {
        connection.release();
      }
    } catch (error) {
      if (error instanceof BadRequestException || 
          error instanceof UnprocessableEntityException || 
          error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error en update:', error);
      throw new InternalServerErrorException('Error al actualizar evento de programación');
    }
  }
  /**
   * Elimina (lógicamente) un evento de programación
   */
  async remove(eventId: number, userId: number): Promise<{ message: string }> {
    try {
      // Validar que userId no sea undefined
      if (!userId) {
        throw new BadRequestException('Usuario no identificado');
      }

      const connection = await this.db.getConnection();
      
      try {
        // Obtener información del evento antes de eliminarlo (para WebSocket)
        const [existingEvents] = await connection.execute(
          'SELECT area_id FROM schedule_events WHERE id = ? AND is_active = TRUE',
          [eventId]
        ) as [RowDataPacket[], any];

        if (!Array.isArray(existingEvents) || existingEvents.length === 0) {
          throw new NotFoundException('Evento no encontrado');
        }

        const areaId = existingEvents[0].area_id;

        // Llamar al stored procedure de eliminación
        await connection.execute(
          'CALL sp_DeleteScheduleEvent(?, ?, ?, @status_code, @error_message)',
          [eventId, userId, true] // true = eliminación lógica
        );

        // Obtener variables de salida
        const [outputResults] = await connection.execute(
          'SELECT @status_code as status_code, @error_message as error_message'
        ) as [RowDataPacket[], any];
        
        const output = outputResults[0];

        if (output.status_code === 'SUCCESS') {
          // Emitir evento WebSocket
          this.schedulingGateway.emitEventDeleted(areaId, eventId);
          return { message: output.error_message || 'Evento eliminado exitosamente' };
        } else if (output.status_code === 'NOT_FOUND') {
          throw new NotFoundException(output.error_message);
        } else {
          throw new InternalServerErrorException(output.error_message);
        }
      } finally {
        connection.release();
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error en remove:', error);
      throw new InternalServerErrorException('Error al eliminar evento de programación');
    }
  }
  /**
   * Obtiene un evento específico por ID
   */
  async findOne(eventId: number): Promise<ScheduleEventDto> {
    try {
      const connection = await this.db.getConnection();
      
      try {
        const [results] = await connection.execute(
          'CALL sp_GetScheduleEvents(?, ?, ?, ?, ?)',
          [null, null, null, null, null]
        );

        const events = Array.isArray(results) && Array.isArray(results[0]) ? results[0] : [];
        const eventsArray = events as RowDataPacket[];
        const event = eventsArray.find((event: any) => event.id === eventId);

        if (!event) {
          throw new NotFoundException('Evento no encontrado');
        }

        return event as ScheduleEventDto;
      } finally {
        connection.release();
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error en findOne:', error);
      throw new InternalServerErrorException('Error al obtener evento de programación');
    }
  }
}
