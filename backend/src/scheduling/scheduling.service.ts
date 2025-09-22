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

  async findAllWithPermissions(query: GetEventsQueryDto, userId: number): Promise<{ data: ScheduleEventDto[], total: number }> {
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
        const startFilter = new Date(start_date);
        const endFilter = new Date(end_date);
        
        // Usar query builder para condiciones más complejas con filtrado por permisos
        const queryBuilder = this.eventRepository.createQueryBuilder('event')
          .leftJoinAndSelect('event.bimestre', 'bimestre')
          .leftJoinAndSelect('event.eventTeachers', 'eventTeachers')
          .leftJoinAndSelect('eventTeachers.teacher', 'teacher')
          .leftJoin('academic_structures', 'academic', 'academic.acronym = event.subject AND academic.id_bimestre = event.bimestre_id AND academic.code = event.plan')
          .addSelect(['academic.name', 'academic.school_prog', 'academic.code', 'academic.level'])
          .where('(event.start_date <= :endFilter AND event.end_date >= :startFilter)', {
            startFilter,
            endFilter
          })
          .andWhere(`(
            -- Verificar permisos por asignaturas permitidas
            event.subject IN (
              SELECT DISTINCT uap.sigla
              FROM usuario_asignaturas_permitidas uap
              WHERE uap.usuario_id = :userId
              ${bimestre_id ? 'AND uap.bimestre_id = :bimestre_id' : ''}
            )
            OR
            -- Verificar permisos por carrera (para eventos de inicio)
            EXISTS (
              SELECT 1 FROM usuario_permisos_carrera upc
              JOIN carreras c ON upc.carrera_id = c.id
              JOIN vacantes_inicio_permanente vip ON c.codigo_plan = vip.codigo_plan
              WHERE upc.usuario_id = :userId AND vip.sigla_asignatura = event.subject AND upc.activo = 1
              ${bimestre_id ? 'AND upc.bimestre_id = :bimestre_id' : ''}
            )
            OR
            -- Verificar permisos por categoría INICIO
            EXISTS (
              SELECT 1 FROM usuario_permisos_categoria upcat
              WHERE upcat.usuario_id = :userId AND upcat.categoria = 'INICIO' AND upcat.activo = 1
              ${bimestre_id ? 'AND upcat.bimestre_id = :bimestre_id' : ''}
            )
          )`, { userId });

        if (active !== undefined) {
          queryBuilder.andWhere('event.active = :active', { active });
        }

        if (bimestre_id) {
          queryBuilder.andWhere('event.bimestre_id = :bimestre_id', { bimestre_id });
        }

        queryBuilder.orderBy('event.updated_at', 'DESC')
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
            (event as any).academic_level = academicData.academic_level;
          }
          return ScheduleEventDto.fromEntity(event);
        });
        const total = await queryBuilder.getCount();
        
        this.logger.log(`Se encontraron ${events.length} eventos de ${total} totales con filtro de fechas y permisos para usuario ${userId}`);
        return { data: eventDtos, total };
      }

      // Para casos sin filtro de fechas, usar query builder con permisos
      const queryBuilder = this.eventRepository.createQueryBuilder('event')
        .leftJoinAndSelect('event.bimestre', 'bimestre')
        .leftJoinAndSelect('event.eventTeachers', 'eventTeachers')
        .leftJoinAndSelect('eventTeachers.teacher', 'teacher')
        .leftJoin('academic_structures', 'academic', 'academic.acronym = event.subject AND academic.id_bimestre = event.bimestre_id AND academic.code = event.plan')
        .addSelect(['academic.name', 'academic.school_prog', 'academic.code', 'academic.level'])
        .where(`(
          -- Verificar permisos por asignaturas permitidas
          event.subject IN (
            SELECT DISTINCT uap.sigla
            FROM usuario_asignaturas_permitidas uap
            WHERE uap.usuario_id = :userId
            ${bimestre_id ? 'AND uap.bimestre_id = :bimestre_id' : ''}
          )
          OR
          -- Verificar permisos por carrera (para eventos de inicio)
          EXISTS (
            SELECT 1 FROM usuario_permisos_carrera upc
            JOIN carreras c ON upc.carrera_id = c.id
            JOIN vacantes_inicio_permanente vip ON c.codigo_plan = vip.codigo_plan
            WHERE upc.usuario_id = :userId AND vip.sigla_asignatura = event.subject AND upc.activo = 1
            ${bimestre_id ? 'AND upc.bimestre_id = :bimestre_id' : ''}
          )
          OR
          -- Verificar permisos por categoría INICIO
          EXISTS (
            SELECT 1 FROM usuario_permisos_categoria upcat
            WHERE upcat.usuario_id = :userId AND upcat.categoria = 'INICIO' AND upcat.activo = 1
            ${bimestre_id ? 'AND upcat.bimestre_id = :bimestre_id' : ''}
          )
        )`, { userId });

      if (active !== undefined) {
        queryBuilder.andWhere('event.active = :active', { active });
      }

      if (bimestre_id) {
        queryBuilder.andWhere('event.bimestre_id = :bimestre_id', { bimestre_id });
      }

      queryBuilder.orderBy('event.updated_at', 'DESC')
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
          (event as any).academic_level = academicData.academic_level;
        }
        return ScheduleEventDto.fromEntity(event);
      });
      const total = await queryBuilder.getCount();
      
      this.logger.log(`Se encontraron ${events.length} eventos de ${total} totales con permisos para usuario ${userId}`);
      return { data: eventDtos, total };
    } catch (error) {
      this.logger.error('Error al obtener eventos con permisos', error);
      throw error;
    }
  }

  async getHoursByOptativasEventPairs(eventPairs: { acronym: string, plan: string }[], bimestreId?: number): Promise<{ totalHours: number, details: any[] }> {
    this.logger.log(`Consultando horas para eventos Optativas con ${eventPairs.length} pares`);
    
    try {
      if (eventPairs.length === 0) {
        return { totalHours: 0, details: [] };
      }
      
      // Construir consulta con condiciones OR para cada par específico (plan, asignatura)
      const pairConditions = eventPairs.map(() => '(plan = ? AND asignatura = ?)').join(' OR ');
      
      let query = `
        SELECT 
          plan,
          asignatura,
          SUM(horas) as total_hours,
          COUNT(*) as subject_count
        FROM asignaturas_optativas_aprobadas 
        WHERE (${pairConditions})`;
      
      // Crear parámetros para cada par (plan, asignatura)
      const queryParams: string[] = [];
      eventPairs.forEach(pair => {
        queryParams.push(pair.plan, pair.acronym);
      });
      
      // Agregar filtro por bimestre si se proporciona
      if (bimestreId) {
        query += ` AND id_bimestre = ?`;
        queryParams.push(bimestreId.toString());
      }
      
      query += ` GROUP BY plan, asignatura`;
      
      this.logger.log(`Ejecutando consulta Optativas con ${eventPairs.length} pares: ${eventPairs.map(p => `${p.plan}-${p.acronym}`).join(', ')}`);
      
      const result = await this.eventRepository.query(query, queryParams);
      
      const totalHours = result.reduce((sum, item) => sum + parseInt(item.total_hours || 0), 0);
      
      this.logger.log(`Total de horas Optativas encontradas: ${totalHours}`);
      
      return {
        totalHours,
        details: result.map(item => ({
          plan: item.plan,
          asignatura: item.asignatura,
          hours: parseInt(item.total_hours || 0),
          subjectCount: parseInt(item.subject_count || 0)
        }))
      };
    } catch (error) {
      this.logger.error('Error al consultar horas por pares de eventos Optativas:', error);
      throw error;
    }
  }

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
          .leftJoin('academic_structures', 'academic', 'academic.acronym = event.subject AND academic.id_bimestre = event.bimestre_id AND academic.code = event.plan')
          .addSelect(['academic.name', 'academic.school_prog', 'academic.code', 'academic.level'])
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

        queryBuilder.orderBy('event.updated_at', 'DESC')
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
            (event as any).academic_level = academicData.academic_level;
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
        .leftJoin('academic_structures', 'academic', 'academic.acronym = event.subject AND academic.id_bimestre = event.bimestre_id AND academic.code = event.plan')
        .addSelect(['academic.name', 'academic.school_prog', 'academic.code', 'academic.level'])
        .orderBy('event.updated_at', 'DESC')
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
  async create(createEventDto: CreateEventDto, userEmail?: string): Promise<ScheduleEventDto> {
    try {
      this.logger.log(`Creating event with data: ${JSON.stringify(createEventDto)}`);
      this.logger.log(`Campo horas recibido: ${createEventDto.horas} (tipo: ${typeof createEventDto.horas})`);
      
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
      
      // Extraer usuario del email (substring antes del '@')
      let usuario: string | undefined;
      if (userEmail) {
        usuario = userEmail.split('@')[0];
        this.logger.log(`Usuario extraído del email ${userEmail}: ${usuario}`);
      }
      
      const event = this.eventRepository.create({
        ...createEventDto,
        start_date: startDate,
        end_date: endDate,
        bimestre_id: bimestreId, // Asignar el bimestre_id determinado automáticamente o proporcionado
        usuario: usuario, // Asignar el usuario extraído del email
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

  async update(id: number, updateEventDto: UpdateEventDto, userEmail?: string): Promise<ScheduleEventDto> {
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
      
      // Actualizar usuario si se proporciona email
      if (userEmail) {
        updateData.usuario = userEmail.split('@')[0];
        this.logger.log(`Usuario actualizado del email ${userEmail}: ${updateData.usuario}`);
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
  async findByBimestreWithPermissions(bimestreId: number, userId: number): Promise<ScheduleEventDto[]> {
    try {
      const queryBuilder = this.eventRepository.createQueryBuilder('event')
        .leftJoinAndSelect('event.bimestre', 'bimestre')
        .leftJoinAndSelect('event.eventTeachers', 'eventTeachers')
        .leftJoinAndSelect('eventTeachers.teacher', 'teacher')
        .leftJoin('academic_structures', 'academic', 'academic.acronym = event.subject AND academic.id_bimestre = event.bimestre_id AND academic.code = event.plan')
        .addSelect(['academic.name', 'academic.school_prog', 'academic.code', 'academic.level'])
        .where('event.bimestre_id = :bimestreId', { bimestreId })
        .andWhere('event.active = :active', { active: true })
        .andWhere(`(
          -- Verificar permisos por asignaturas permitidas
          event.subject IN (
            SELECT DISTINCT uap.sigla
            FROM usuario_asignaturas_permitidas uap
            WHERE uap.usuario_id = :userId AND uap.bimestre_id = :bimestreId
          )
          OR
          -- Verificar permisos por carrera (para eventos de inicio)
          EXISTS (
            SELECT 1 FROM usuario_permisos_carrera upc
            JOIN carreras c ON upc.carrera_id = c.id
            JOIN vacantes_inicio_permanente vip ON c.codigo_plan = vip.codigo_plan
            WHERE upc.usuario_id = :userId AND vip.sigla_asignatura = event.subject AND upc.activo = 1 AND upc.bimestre_id = :bimestreId
          )
          OR
          -- Verificar permisos por categoría INICIO
          EXISTS (
            SELECT 1 FROM usuario_permisos_categoria upcat
            WHERE upcat.usuario_id = :userId AND upcat.categoria = 'INICIO' AND upcat.activo = 1 AND upcat.bimestre_id = :bimestreId
          )
        )`, { userId, bimestreId })
        .orderBy('event.start_date', 'ASC');

      const result = await queryBuilder.getRawAndEntities();
      const events = result.entities;
      const raw = result.raw;
      const eventDtos = events.map(event => {
        const academicData = raw.find(r => r.event_id === event.id);
        if (academicData) {
          (event as any).academic_name = academicData.academic_name;
          (event as any).academic_school_prog = academicData.academic_school_prog;
          (event as any).academic_code = academicData.academic_code;
          (event as any).academic_level = academicData.academic_level;
        }
        return ScheduleEventDto.fromEntity(event);
      });

      this.logger.log(`Se encontraron ${events.length} eventos del bimestre ${bimestreId} con permisos para usuario ${userId}`);
      return eventDtos;
    } catch (error) {
      this.logger.error(`Error al obtener eventos del bimestre ${bimestreId} con permisos`, error);
      throw error;
    }
  }

  async findADOLEventsByBimestre(bimestreId: number, userEmail: string): Promise<ScheduleEventDto[]> {
    try {
      // Extraer el substring antes del '@' del email del usuario
      const userSubstring = userEmail.split('@')[0];
      
      const queryBuilder = this.eventRepository.createQueryBuilder('event')
        .leftJoinAndSelect('event.bimestre', 'bimestre')
        .leftJoinAndSelect('event.eventTeachers', 'eventTeachers')
        .leftJoinAndSelect('eventTeachers.teacher', 'teacher')
        .leftJoin('academic_structures', 'academic', 'academic.acronym = event.subject AND academic.id_bimestre = event.bimestre_id AND academic.code = event.plan')
        .addSelect(['academic.name', 'academic.school_prog', 'academic.code', 'academic.level'])
        .where('event.bimestre_id = :bimestreId', { bimestreId })
        .andWhere('event.active = :active', { active: true })
        .andWhere('event.title LIKE :adolPrefix', { adolPrefix: 'ADOL%' })
        .andWhere('event.usuario = :userSubstring', { userSubstring })
        .orderBy('event.start_date', 'ASC');

      const result = await queryBuilder.getRawAndEntities();
      const events = result.entities;
      const raw = result.raw;
      const eventDtos = events.map(event => {
        const academicData = raw.find(r => r.event_id === event.id);
        if (academicData) {
          (event as any).academic_name = academicData.academic_name;
          (event as any).academic_school_prog = academicData.academic_school_prog;
          (event as any).academic_code = academicData.academic_code;
          (event as any).academic_level = academicData.academic_level;
        }
        return ScheduleEventDto.fromEntity(event);
      });

      this.logger.log(`Se encontraron ${events.length} eventos ADOL del bimestre ${bimestreId} para usuario ${userSubstring}`);
      return eventDtos;
    } catch (error) {
      this.logger.error(`Error al obtener eventos ADOL del bimestre ${bimestreId}`, error);
      throw error;
    }
  }

  async findOptativasEventsByBimestre(bimestreId: number): Promise<ScheduleEventDto[]> {
    try {
      const queryBuilder = this.eventRepository.createQueryBuilder('event')
        .leftJoinAndSelect('event.bimestre', 'bimestre')
        .leftJoinAndSelect('event.eventTeachers', 'eventTeachers')
        .leftJoinAndSelect('eventTeachers.teacher', 'teacher')
        .leftJoin('academic_structures', 'academic', 'academic.acronym = event.subject AND academic.id_bimestre = event.bimestre_id AND academic.code = event.plan')
        .addSelect(['academic.name', 'academic.school_prog', 'academic.code', 'academic.level'])
        .innerJoin('asignaturas_optativas_aprobadas', 'optativas', 
          'TRIM(SUBSTRING(event.title, 1, LOCATE(\' - \', event.title) - 1)) = TRIM(optativas.asignatura)')
        .addSelect('optativas.plan', 'optativas_plan')
        .addSelect('optativas.nivel', 'optativas_nivel')
        .where('event.bimestre_id = :bimestreId', { bimestreId })
        .andWhere('event.active = :active', { active: true })
        .orderBy('event.start_date', 'ASC');

      const result = await queryBuilder.getRawAndEntities();
      const events = result.entities;
      const raw = result.raw;
      const eventDtos = events.map(event => {
        const academicData = raw.find(r => r.event_id === event.id);
        if (academicData) {
          (event as any).academic_name = academicData.academic_name;
          (event as any).academic_school_prog = academicData.academic_school_prog;
          (event as any).academic_code = academicData.academic_code;
          (event as any).academic_level = academicData.optativas_nivel; // Usar nivel desde asignaturas_optativas_aprobadas
          (event as any).plan = academicData.optativas_plan;
        }
        return ScheduleEventDto.fromEntity(event);
      });

      this.logger.log(`Se encontraron ${events.length} eventos optativas del bimestre ${bimestreId}`);
      return eventDtos;
    } catch (error) {
      this.logger.error(`Error al obtener eventos optativas del bimestre ${bimestreId}`, error);
      throw error;
    }
  }

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

  // Método para obtener el siguiente correlativo para una asignatura
  async getNextCorrelativeForSubject(subjectName: string, bimestreId?: number): Promise<number> {
    try {
      this.logger.log(`=== DEBUG getNextCorrelativeForSubject ===`);
      this.logger.log(`Parámetro recibido - subjectName: "${subjectName}", bimestreId: ${bimestreId}`);
      
      // 1. Extraer el código limpio de la asignatura
      // Si ya es un código limpio (ej: "ADOL001"), usarlo directamente
      // Si es un título completo (ej: "ADOL001 - COORDINADOR DE LÍNEA ONLINE - 001"), extraer la primera parte
      const cleanSubjectCode = subjectName.includes(' - ') ? subjectName.split(' - ')[0].trim() : subjectName.trim();
      
      this.logger.log(`Código extraído: "${cleanSubjectCode}"`);

      // 2. Determinar el bimestre actual si no se proporciona
      let targetBimestreId = bimestreId;
      if (!targetBimestreId) {
        const currentBimestre = await this.bimestreService.findBimestreActual();
        targetBimestreId = currentBimestre.id;
        this.logger.log(`Bimestre determinado automáticamente: ${targetBimestreId}`);
      } else {
        this.logger.log(`Bimestre proporcionado: ${targetBimestreId}`);
      }

      // 3. Consultar schedule_events para contar registros activos del bimestre actual
      this.logger.log(`Buscando eventos con: subject="${cleanSubjectCode}", active=true, bimestre_id=${targetBimestreId}`);
      
      const existingEventsCount = await this.eventRepository.count({
        where: {
          subject: cleanSubjectCode,  // Coincidencia exacta en el campo subject
          active: true,               // Estado ACTIVE = 1
          bimestre_id: targetBimestreId // Del bimestre actual
        }
      });

      this.logger.log(`Eventos encontrados: ${existingEventsCount}`);
      
      // También buscar todos los eventos para debug
      const allEvents = await this.eventRepository.find({
        where: {
          bimestre_id: targetBimestreId,
          active: true
        },
        select: ['id', 'title', 'subject']
      });
      
      this.logger.log(`Todos los eventos activos en bimestre ${targetBimestreId}:`);
      allEvents.forEach(event => {
        this.logger.log(`  - ID: ${event.id}, Title: "${event.title}", Subject: "${event.subject}"`);
      });

      // 4. Generar el correlativo basado en el conteo
      // n registros existentes → asignar correlativo n+1
      const nextCorrelative = existingEventsCount + 1;

      this.logger.log(`Correlativo calculado para ${cleanSubjectCode} en bimestre ${targetBimestreId}: ${nextCorrelative} (eventos existentes: ${existingEventsCount})`);
      this.logger.log(`=== FIN DEBUG getNextCorrelativeForSubject ===`);

      return nextCorrelative;
    } catch (error) {
      this.logger.error(`Error al obtener correlativo para ${subjectName}`, error);
      throw error;
    }
  }

  async getHoursByADOLEvents(eventTitles: string[], bimestreId?: number): Promise<{ totalHours: number, details: any[] }> {
    this.logger.log(`Consultando horas para eventos ADOL: ${eventTitles.join(', ')} en bimestre: ${bimestreId}`);
    
    try {
      if (eventTitles.length === 0) {
        return { totalHours: 0, details: [] };
      }
      
      // Construir consulta para buscar eventos por título (case insensitive)
      let query = `
        SELECT 
          title,
          horas,
          COUNT(*) as event_count
        FROM schedule_events 
        WHERE UPPER(title) IN (${eventTitles.map(() => 'UPPER(?)').join(',')})`;
      
      const queryParams = [...eventTitles];
      
      // Agregar filtro por bimestre si se proporciona
      if (bimestreId) {
        query += ` AND bimestre_id = ?`;
        queryParams.push(bimestreId.toString());
      }
      
      query += ` GROUP BY title, horas`;
      
      this.logger.log(`Ejecutando consulta ADOL para títulos: ${eventTitles.join(', ')}`);
      this.logger.log(`Query SQL: ${query}`);
      this.logger.log(`Parámetros: ${JSON.stringify(queryParams)}`);
      
      const result = await this.eventRepository.query(query, queryParams);
      
      this.logger.log(`Resultado de consulta ADOL: ${JSON.stringify(result)}`);
      
      const totalHours = result.reduce((sum, item) => sum + (parseFloat(item.horas || 0) * parseInt(item.event_count || 1)), 0);
      
      this.logger.log(`Total de horas ADOL encontradas: ${totalHours}`);
      
      return {
        totalHours,
        details: result.map(item => ({
          title: item.title,
          hours: parseFloat(item.horas || 0),
          eventCount: parseInt(item.event_count || 1),
          totalHours: parseFloat(item.horas || 0) * parseInt(item.event_count || 1)
        }))
      };
    } catch (error) {
      this.logger.error('Error al consultar horas por eventos ADOL:', error);
      throw error;
    }
  }

  async getHoursByCodes(codes: string[], bimestreId?: number, plans?: string[]): Promise<{ totalHours: number, details: any[] }> {
    this.logger.log(`Consultando horas para codigos: ${codes.join(', ')} en bimestre: ${bimestreId} con planes: ${plans?.join(', ') || 'todos'}`);
    
    try {
      // Consultar la estructura academica para obtener las horas por codigo
      let query = `
        SELECT 
          code,
          acronym,
          SUM(hours) as total_hours,
          COUNT(*) as subject_count
        FROM academic_structures 
        WHERE acronym IN (${codes.map(() => '?').join(',')})`;
      
      const queryParams = [...codes];
      
      // Agregar filtro por bimestre si se proporciona
      if (bimestreId) {
        query += ` AND id_bimestre = ?`;
        queryParams.push(bimestreId.toString());
      }
      
      // Agregar filtro por planes si se proporciona
      if (plans && plans.length > 0) {
        query += ` AND code IN (${plans.map(() => '?').join(',')})`;
        queryParams.push(...plans);
      }
      
      query += ` GROUP BY code, acronym`;
      
      const result = await this.eventRepository.query(query, queryParams);
      
      const totalHours = result.reduce((sum, item) => sum + parseInt(item.total_hours || 0), 0);
      
      this.logger.log(`Total de horas encontradas: ${totalHours}`);
      
      return {
        totalHours,
        details: result.map(item => ({
          code: item.code,
          acronym: item.acronym,
          hours: parseInt(item.total_hours || 0),
          subjectCount: parseInt(item.subject_count || 0)
        }))
      };
    } catch (error) {
      this.logger.error('Error al consultar horas por codigos:', error);
      throw new BadRequestException('Error al consultar horas de asignaturas');
    }
  }

  async getHoursByEventPairs(eventPairs: { acronym: string, plan: string }[], bimestreId?: number): Promise<{ totalHours: number, details: any[] }> {
    this.logger.log(`Consultando horas para ${eventPairs.length} pares específicos en bimestre: ${bimestreId}`);
    
    try {
      if (eventPairs.length === 0) {
        return { totalHours: 0, details: [] };
      }
      
      // Construir consulta con condiciones OR para cada par específico
      const pairConditions = eventPairs.map(() => '(acronym = ? AND code = ?)').join(' OR ');
      
      let query = `
        SELECT 
          code,
          acronym,
          SUM(hours) as total_hours,
          COUNT(*) as subject_count
        FROM academic_structures 
        WHERE (${pairConditions})`;
      
      // Crear parámetros para cada par (acronym, plan)
      const queryParams: string[] = [];
      eventPairs.forEach(pair => {
        queryParams.push(pair.acronym, pair.plan);
      });
      
      // Agregar filtro por bimestre si se proporciona
      if (bimestreId) {
        query += ` AND id_bimestre = ?`;
        queryParams.push(bimestreId.toString());
      }
      
      query += ` GROUP BY code, acronym`;
      
      this.logger.log(`Ejecutando consulta con ${eventPairs.length} pares: ${eventPairs.map(p => `${p.acronym}-${p.plan}`).join(', ')}`);
      
      const result = await this.eventRepository.query(query, queryParams);
      
      const totalHours = result.reduce((sum, item) => sum + parseInt(item.total_hours || 0), 0);
      
      this.logger.log(`Total de horas encontradas: ${totalHours}`);
      
      return {
        totalHours,
        details: result.map(item => ({
          code: item.code,
          acronym: item.acronym,
          hours: parseInt(item.total_hours || 0),
          subjectCount: parseInt(item.subject_count || 0)
        }))
      };
    } catch (error) {
      this.logger.error('Error al consultar horas por pares de eventos:', error);
      throw new BadRequestException('Error al consultar horas de asignaturas por pares');
    }
  }
}
