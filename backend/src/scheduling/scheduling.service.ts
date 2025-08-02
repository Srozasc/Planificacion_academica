import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindManyOptions } from 'typeorm';
import { ScheduleEvent } from './entities/schedule-event.entity';
import { EventTeacher } from './entities/event-teacher.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { GetEventsQueryDto } from './dto/get-events-query.dto';
import { ScheduleEventDto } from './dto/schedule-event.dto';
import { BimestreService } from '../common/services/bimestre.service';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(
    @InjectRepository(ScheduleEvent)
    private readonly eventRepository: Repository<ScheduleEvent>,
    @InjectRepository(EventTeacher)
    private readonly eventTeacherRepository: Repository<EventTeacher>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    private readonly bimestreService: BimestreService,
  ) {}

  async findAll(query: GetEventsQueryDto): Promise<{ data: ScheduleEventDto[], total: number }> {
    try {
      const { start_date, end_date, bimestre_id, active, page = 1, limit = 50 } = query;
      
      // Construir condiciones WHERE
      const where: any = {};

      if (active !== undefined) {
        where.active = active;
      }

      if (bimestre_id) {
        where.bimestre_id = bimestre_id;
      }

      // Filtrado por fechas: un evento se incluye si hay alguna superposición con el rango solicitado
      if (start_date && end_date) {
        // Un evento se incluye si:
        // - Su fecha de inicio está dentro del rango, O
        // - Su fecha de fin está dentro del rango, O  
        // - El evento abarca todo el rango (inicio antes y fin después)
        const startFilter = new Date(start_date);
        const endFilter = new Date(end_date);
        
        // Usar query builder para condiciones más complejas
        const queryBuilder = this.eventRepository.createQueryBuilder('event')
          .leftJoinAndSelect('event.bimestre', 'bimestre')
          .leftJoinAndSelect('event.eventTeachers', 'eventTeachers')
          .leftJoinAndSelect('eventTeachers.teacher', 'teacher')
          .leftJoin('academic_structures', 'academic', 'academic.acronym = event.subject')
          .addSelect(['academic.name', 'academic.school_prog', 'academic.code'])
          .where('(event.start_date <= :endFilter AND event.end_date >= :startFilter)', {
            startFilter,
            endFilter
          });

        if (active !== undefined) {
          queryBuilder.andWhere('event.active = :active', { active });
        }

        if (bimestre_id) {
          queryBuilder.andWhere('event.bimestre_id = :bimestre_id', { bimestre_id });
        }

        queryBuilder.orderBy('event.start_date', 'ASC')
          .skip((page - 1) * limit)
          .take(limit);

        const result = await queryBuilder.getRawAndEntities();
        const events = result.entities;
        const raw = result.raw;
        const eventDtos = events.map(event => {
          const academicData = raw.find(r => r.event_id === event.id);
          if (academicData) {
            (event as any).academic_name = academicData.academic_name;
            (event as any).academic_school_prog = academicData.academic_school_prog;
            (event as any).academic_code = academicData.academic_code;
          }
          return ScheduleEventDto.fromEntity(event);
        });
        const total = await queryBuilder.getCount();
        
        this.logger.log(`Se encontraron ${events.length} eventos de ${total} totales con filtro de fechas`);
        return { data: eventDtos, total };
      } else if (start_date) {
        where.start_date = Between(new Date(start_date), new Date('2100-12-31'));
      } else if (end_date) {
        where.end_date = Between(new Date('1900-01-01'), new Date(end_date));
      }

      // Primero obtener el conteo total sin relaciones para evitar problemas con LEFT JOIN
      const total = await this.eventRepository.count({ where });
      
      // Usar query builder para incluir academic_structures
      const queryBuilder = this.eventRepository.createQueryBuilder('event')
        .leftJoinAndSelect('event.bimestre', 'bimestre')
        .leftJoinAndSelect('event.eventTeachers', 'eventTeachers')
        .leftJoinAndSelect('eventTeachers.teacher', 'teacher')
        .leftJoin('academic_structures', 'academic', 'academic.acronym = event.subject')
        .addSelect(['academic.name', 'academic.school_prog', 'academic.code'])
        .orderBy('event.start_date', 'ASC')
        .skip((page - 1) * limit)
        .take(limit);

      // Aplicar condiciones WHERE
      if (active !== undefined) {
        queryBuilder.andWhere('event.active = :active', { active });
      }
      if (bimestre_id) {
        queryBuilder.andWhere('event.bimestre_id = :bimestre_id', { bimestre_id });
      }

      const result = await queryBuilder.getRawAndEntities();
      const events = result.entities;
      const raw = result.raw;
      const eventDtos = events.map(event => {
         const academicData = raw.find(r => r.event_id === event.id);
         if (academicData) {
           (event as any).academic_name = academicData.academic_name;
           (event as any).academic_school_prog = academicData.academic_school_prog;
           (event as any).academic_code = academicData.academic_code;
         }
         return ScheduleEventDto.fromEntity(event);
       });

      this.logger.log(`Se encontraron ${events.length} eventos de ${total} totales`);
      
      return { data: eventDtos, total };
    } catch (error) {
      this.logger.error('Error al obtener eventos', error);
      throw error;
    }
  }

  async findById(id: number): Promise<ScheduleEventDto> {
    try {
      const event = await this.eventRepository.findOne({
        where: { id },
        relations: ['bimestre', 'eventTeachers', 'eventTeachers.teacher'],
      });

      if (!event) {
        throw new NotFoundException(`Evento con ID ${id} no encontrado`);
      }

      this.logger.log(`Evento encontrado: ${event.title} (ID: ${event.id})`);
      return ScheduleEventDto.fromEntity(event);
    } catch (error) {
      this.logger.error(`Error al obtener evento ${id}`, error);
      throw error;
    }
  }
  async create(createEventDto: CreateEventDto): Promise<ScheduleEventDto> {
    try {
      this.logger.log(`Creating event with data: ${JSON.stringify(createEventDto)}`);
      
      // Validar fechas
      const startDate = new Date(createEventDto.start_date);
      const endDate = new Date(createEventDto.end_date);

      this.logger.log(`Parsed dates - Start: ${startDate.toISOString()}, End: ${endDate.toISOString()}`);

      if (endDate <= startDate) {
        throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      // Usar bimestre_id proporcionado desde el frontend (navbar)
      let bimestreId = createEventDto.bimestre_id;
      
      this.logger.log(`Bimestre_id recibido desde frontend: ${bimestreId} (tipo: ${typeof bimestreId})`);
      
      if (!bimestreId) {
        this.logger.log('Bimestre_id no proporcionado desde frontend, determinando automáticamente como fallback...');
        // Buscar el bimestre que contiene la fecha de inicio del evento (solo como fallback)
        const bimestreEncontrado = await this.bimestreService.findBimestreByFecha(startDate);
        if (bimestreEncontrado) {
          bimestreId = bimestreEncontrado.id;
          this.logger.log(`Bimestre determinado automáticamente como fallback: ${bimestreEncontrado.nombre} (ID: ${bimestreId})`);
        } else {
          this.logger.warn(`No se pudo determinar automáticamente el bimestre para el evento con fecha de inicio: ${startDate.toISOString()}`);
        }
      } else {
        this.logger.log(`Usando bimestre_id proporcionado desde frontend (navbar): ${bimestreId}`);
      }
      
      // Validar que el evento esté dentro del bimestre si se especifica o se determinó automáticamente
      if (bimestreId) {
        const bimestre = await this.bimestreService.findById(bimestreId);
        
        if (startDate < bimestre.fechaInicio || endDate > bimestre.fechaFin) {
          throw new BadRequestException(
            `El evento debe estar dentro del rango de fechas del bimestre (${bimestre.fechaInicio.toDateString()} - ${bimestre.fechaFin.toDateString()})`
          );
        }
      }

      // Verificar conflictos de horario (opcional)
      await this.checkConflicts(startDate, endDate, createEventDto.room);

      this.logger.log(`Valor de bimestreId antes de crear evento: ${bimestreId} (tipo: ${typeof bimestreId})`);
      
      const event = this.eventRepository.create({
        ...createEventDto,
        start_date: startDate,
        end_date: endDate,
        bimestre_id: bimestreId, // Asignar el bimestre_id determinado automáticamente o proporcionado
      });
      
      this.logger.log(`Evento creado con bimestre_id: ${event.bimestre_id}`);
      this.logger.log(`Objeto evento completo: ${JSON.stringify(event, null, 2)}`);

      const savedEvent = await this.eventRepository.save(event);
      
      // Manejar asignación de docentes
      if (createEventDto.teacher_ids && createEventDto.teacher_ids.length > 0) {
        await this.assignTeachersToEvent(savedEvent.id, createEventDto.teacher_ids);
      }
      
      // Recargar con relaciones
      const eventWithRelations = await this.findById(savedEvent.id);

      this.logger.log(`Evento creado: ${savedEvent.title} (ID: ${savedEvent.id})`);
      return eventWithRelations;
    } catch (error) {
      this.logger.error('Error al crear evento', error);
      throw error;
    }
  }

  async update(id: number, updateEventDto: UpdateEventDto): Promise<ScheduleEventDto> {
    try {
      const existingEvent = await this.eventRepository.findOne({ where: { id } });
      
      if (!existingEvent) {
        throw new NotFoundException(`Evento con ID ${id} no encontrado`);
      }

      // Validar fechas si se están actualizando
      if (updateEventDto.start_date || updateEventDto.end_date) {
        const startDate = updateEventDto.start_date 
          ? new Date(updateEventDto.start_date) 
          : existingEvent.start_date;
        const endDate = updateEventDto.end_date 
          ? new Date(updateEventDto.end_date) 
          : existingEvent.end_date;

        if (endDate <= startDate) {
          throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
        }

        // Validar que el evento esté dentro del bimestre
        const bimestreId = updateEventDto.bimestre_id || existingEvent.bimestre_id;
        if (bimestreId) {
          const bimestre = await this.bimestreService.findById(bimestreId);
          
          if (startDate < bimestre.fechaInicio || endDate > bimestre.fechaFin) {
            throw new BadRequestException(
              `El evento debe estar dentro del rango de fechas del bimestre (${bimestre.fechaInicio.toDateString()} - ${bimestre.fechaFin.toDateString()})`
            );
          }
        }

        // Verificar conflictos de horario
        await this.checkConflicts(startDate, endDate, updateEventDto.room || existingEvent.room, id);
      }

      // Preparar datos para actualización (excluir teacher_ids ya que se maneja por separado)
      const { teacher_ids, ...updateDataRaw } = updateEventDto;
      const updateData: any = { ...updateDataRaw };
      if (updateEventDto.start_date) {
        updateData.start_date = new Date(updateEventDto.start_date);
      }
      if (updateEventDto.end_date) {
        updateData.end_date = new Date(updateEventDto.end_date);
      }

      await this.eventRepository.update(id, updateData);
      
      // Manejar actualización de docentes si se proporcionan
      if (updateEventDto.teacher_ids !== undefined) {
        await this.updateEventTeachers(id, updateEventDto.teacher_ids);
      }
      
      const updatedEvent = await this.findById(id);

      this.logger.log(`Evento actualizado: ${updatedEvent.title} (ID: ${id})`);
      return updatedEvent;
    } catch (error) {
      this.logger.error(`Error al actualizar evento ${id}`, error);
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const event = await this.eventRepository.findOne({ where: { id } });
      
      if (!event) {
        throw new NotFoundException(`Evento con ID ${id} no encontrado`);
      }

      await this.eventRepository.remove(event);

      this.logger.log(`Evento eliminado: ${event.title} (ID: ${id})`);
    } catch (error) {
      this.logger.error(`Error al eliminar evento ${id}`, error);
      throw error;
    }
  }

  async deactivate(id: number): Promise<ScheduleEventDto> {
    try {
      return await this.update(id, { active: false });
    } catch (error) {
      this.logger.error(`Error al desactivar evento ${id}`, error);
      throw error;
    }
  }

  // Método helper para verificar conflictos de horario
  private async checkConflicts(startDate: Date, endDate: Date, room?: string, excludeId?: number): Promise<void> {
    if (!room) return; // Si no hay sala específica, no verificamos conflictos

    const conflictQuery = this.eventRepository
      .createQueryBuilder('event')
      .where('event.room = :room', { room })
      .andWhere('event.active = :active', { active: true })
      .andWhere('event.start_date < :endDate', { endDate })
      .andWhere('event.end_date > :startDate', { startDate });

    if (excludeId) {
      conflictQuery.andWhere('event.id != :excludeId', { excludeId });
    }

    const conflictingEvents = await conflictQuery.getMany();

    if (conflictingEvents.length > 0) {
      const conflicts = conflictingEvents.map(e => `"${e.title}" (${e.start_date.toLocaleString()} - ${e.end_date.toLocaleString()})`).join(', ');
      throw new ConflictException(
        `Conflicto de horario en la sala "${room}". Eventos en conflicto: ${conflicts}`
      );
    }
  }

  // Métodos helper para manejar docentes múltiples
  private async assignTeachersToEvent(eventId: number, teacherIds: number[]): Promise<void> {
    try {
      // Verificar que todos los docentes existen
      const teachers = await this.teacherRepository.findByIds(teacherIds);
      if (teachers.length !== teacherIds.length) {
        throw new BadRequestException('Uno o más docentes no existen');
      }

      // Obtener el evento para extraer el bimestre_id
      const event = await this.eventRepository.findOne({ where: { id: eventId } });
      if (!event) {
        throw new NotFoundException(`Evento con ID ${eventId} no encontrado`);
      }

      // Crear las relaciones event-teacher incluyendo el id_bimestre
      const eventTeachers = teacherIds.map(teacherId => 
        this.eventTeacherRepository.create({
          eventId: eventId,
          teacherId: teacherId,
          idBimestre: event.bimestre_id // Asignar el bimestre del evento
        })
      );

      await this.eventTeacherRepository.save(eventTeachers);
      this.logger.log(`Asignados ${teacherIds.length} docentes al evento ${eventId} con bimestre ${event.bimestre_id}`);
    } catch (error) {
      this.logger.error(`Error al asignar docentes al evento ${eventId}`, error);
      throw error;
    }
  }

  private async updateEventTeachers(eventId: number, teacherIds: number[]): Promise<void> {
    try {
      // Eliminar asignaciones existentes
      await this.eventTeacherRepository.delete({ eventId: eventId });

      // Asignar nuevos docentes si se proporcionan
      if (teacherIds && teacherIds.length > 0) {
        await this.assignTeachersToEvent(eventId, teacherIds);
      }

      this.logger.log(`Actualizadas asignaciones de docentes para evento ${eventId}`);
    } catch (error) {
      this.logger.error(`Error al actualizar docentes del evento ${eventId}`, error);
      throw error;
    }
  }

  // Método para obtener eventos por bimestre
  async findByBimestre(bimestreId: number): Promise<ScheduleEventDto[]> {
    try {
      const events = await this.eventRepository.find({
        where: { bimestre_id: bimestreId, active: true },
        relations: ['bimestre', 'eventTeachers', 'eventTeachers.teacher'],
        order: { start_date: 'ASC' },
      });

      return events.map(event => ScheduleEventDto.fromEntity(event));
    } catch (error) {
      this.logger.error(`Error al obtener eventos del bimestre ${bimestreId}`, error);
      throw error;
    }
  }

  // Método para obtener estadísticas del dashboard
  async getEventStats(): Promise<any> {
    try {
      // Total de eventos activos
      const totalEvents = await this.eventRepository.count({ where: { active: true } });

      // Docentes activos - consulta directa a la base de datos
      const activeTeachersResult = await this.eventRepository.query(
        'SELECT COUNT(DISTINCT teacher) as count FROM schedule_events WHERE active = 1 AND teacher IS NOT NULL AND teacher != ""'
      );
      const activeTeachers = activeTeachersResult[0]?.count || 0;

      // Aulas utilizadas - consulta directa a la base de datos
      const usedRoomsResult = await this.eventRepository.query(
        'SELECT COUNT(DISTINCT room) as count FROM schedule_events WHERE active = 1 AND room IS NOT NULL AND room != ""'
      );
      const usedRooms = usedRoomsResult[0]?.count || 0;

      this.logger.log(`Estadísticas del dashboard: ${totalEvents} eventos, ${activeTeachers} docentes activos, ${usedRooms} aulas utilizadas`);

      return {
        totalEvents,
        activeTeachers,
        usedRooms,
      };
    } catch (error) {
      this.logger.error('Error al obtener estadísticas del dashboard', error);
      throw error;
    }
  }
}
