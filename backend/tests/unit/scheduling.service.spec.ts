
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

import { SchedulingService } from 'src/scheduling/scheduling.service';
import { BimestreService } from 'src/common/services/bimestre.service';
import { ScheduleEvent } from 'src/scheduling/entities/schedule-event.entity';
import { EventTeacher } from 'src/scheduling/entities/event-teacher.entity';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { CreateEventDto } from 'src/scheduling/dto/create-event.dto';
import { UpdateEventDto } from 'src/scheduling/dto/update-event.dto';

// Mocks para los repositorios y servicios
const mockEventRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  query: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockEventTeacherRepository = {
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

const mockTeacherRepository = {
  findByIds: jest.fn(),
};

const mockBimestreService = {
  findBimestreByFecha: jest.fn(),
  findById: jest.fn(),
};

describe('SchedulingService', () => {
  let service: SchedulingService;
  let eventRepository: Repository<ScheduleEvent>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulingService,
        { provide: getRepositoryToken(ScheduleEvent), useValue: mockEventRepository },
        { provide: getRepositoryToken(EventTeacher), useValue: mockEventTeacherRepository },
        { provide: getRepositoryToken(Teacher), useValue: mockTeacherRepository },
        { provide: BimestreService, useValue: mockBimestreService },
      ],
    }).compile();

    service = module.get<SchedulingService>(SchedulingService);
    eventRepository = module.get<Repository<ScheduleEvent>>(getRepositoryToken(ScheduleEvent));
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  // Pruebas para create()
  describe('create', () => {
    const createEventDto: CreateEventDto = {
      title: 'Clase de Prueba',
      start_date: '2025-03-01T10:00:00.000Z',
      end_date: '2025-03-01T12:00:00.000Z',
      room: 'Aula 101',
      teacher_ids: [1],
    };

    it('debería crear un evento exitosamente', async () => {
      mockEventRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });
      const createdEvent = { id: 1, ...createEventDto, start_date: new Date(createEventDto.start_date), end_date: new Date(createEventDto.end_date) };
      mockEventRepository.create.mockReturnValue(createdEvent);
      mockEventRepository.save.mockResolvedValue(createdEvent);
      mockEventRepository.findOne.mockResolvedValue({ ...createdEvent, eventTeachers: [] });
      mockTeacherRepository.findByIds.mockResolvedValue([{ id: 1, name: 'Profesor Ejemplo' }]);

      const result = await service.create(createEventDto);
      expect(result).toBeDefined();
      expect(mockEventRepository.save).toHaveBeenCalledWith(createdEvent);
    });

    it('debería lanzar BadRequestException por fechas inválidas', async () => {
      const invalidDto = { ...createEventDto, end_date: '2025-03-01T09:00:00.000Z' };
      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar ConflictException por conflicto de horario', async () => {
      mockEventRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ 
          id: 2, 
          title: 'Otro Evento',
          description: null,
          start_date: new Date('2025-03-01T11:00:00.000Z'),
          end_date: new Date('2025-03-01T13:00:00.000Z'),
          teacher: null,
          subject: null,
          room: 'Aula 101',
          students: null,
          background_color: null,
          bimestre_id: null,
          active: true,
          created_at: new Date(),
          updated_at: new Date(),
        }]),
      });
      await expect(service.create(createEventDto)).rejects.toThrow(ConflictException);
    });
  });

  // Pruebas para findAll()
  describe('findAll', () => {
    it('debería retornar un array de eventos y el total', async () => {
      const events = [{ id: 1, title: 'Evento 1' }];
      const total = 1;
      mockEventRepository.find.mockResolvedValue(events);
      mockEventRepository.count.mockResolvedValue(total);

      const result = await service.findAll({});
      expect(result.data).toEqual(expect.any(Array));
      expect(result.total).toEqual(total);
      expect(mockEventRepository.find).toHaveBeenCalled();
    });
  });

  // Pruebas para findById()
  describe('findById', () => {
    it('debería retornar un solo evento', async () => {
      const event = { id: 1, title: 'Evento Encontrado' };
      mockEventRepository.findOne.mockResolvedValue(event);
      const result = await service.findById(1);
      expect(result).toEqual(expect.any(Object));
      expect(result.id).toBe(1);
    });

    it('debería lanzar NotFoundException si el evento no existe', async () => {
      mockEventRepository.findOne.mockResolvedValue(null);
      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });
  });

  // Pruebas para update()
  describe('update', () => {
    const updateEventDto: UpdateEventDto = { title: 'Título Actualizado' };
    const existingEvent = { id: 1, title: 'Título Original', start_date: new Date(), end_date: new Date(Date.now() + 3600000) };

    it('debería actualizar un evento exitosamente', async () => {
      mockEventRepository.findOne.mockResolvedValue(existingEvent);
      mockEventRepository.update.mockResolvedValue({ affected: 1 });
      // Mock para la recarga del evento actualizado
      mockEventRepository.findOne.mockResolvedValue({ ...existingEvent, ...updateEventDto });

      const result = await service.update(1, updateEventDto);
      expect(result).toBeDefined();
      expect(result.title).toBe('Título Actualizado');
      expect(mockEventRepository.update).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('debería lanzar NotFoundException si el evento a actualizar no existe', async () => {
      mockEventRepository.findOne.mockResolvedValue(null);
      await expect(service.update(99, updateEventDto)).rejects.toThrow(NotFoundException);
    });
  });

  // Pruebas para remove()
  describe('remove', () => {
    it('debería eliminar un evento exitosamente', async () => {
      const event = { id: 1, title: 'Evento a Eliminar' };
      mockEventRepository.findOne.mockResolvedValue(event);
      mockEventRepository.remove.mockResolvedValue(event); // Simula que remove retorna el objeto eliminado

      await service.remove(1);
      expect(mockEventRepository.remove).toHaveBeenCalledWith(event);
    });

    it('debería lanzar NotFoundException si el evento a eliminar no existe', async () => {
      mockEventRepository.findOne.mockResolvedValue(null);
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });

  // Pruebas para deactivate()
  describe('deactivate', () => {
    it('debería llamar al método update con active: false', async () => {
        const existingEvent = { id: 1, title: 'Evento a Desactivar', active: true, start_date: new Date(), end_date: new Date(Date.now() + 3600000) };
        const deactivatedEvent = { ...existingEvent, active: false };

        // Espiar el método 'update' del propio servicio
        const updateSpy = jest.spyOn(service, 'update').mockResolvedValue(deactivatedEvent as any);

        const result = await service.deactivate(1);
        
        expect(updateSpy).toHaveBeenCalledWith(1, { active: false });
        expect(result.active).toBe(false);

        updateSpy.mockRestore(); // Restaurar el espía
    });
  });

  // Pruebas para findByBimestre()
  describe('findByBimestre', () => {
    it('debería retornar eventos para un bimestre dado', async () => {
      const events = [{ id: 1, title: 'Evento de Bimestre', bimestre_id: 1 }];
      mockEventRepository.find.mockResolvedValue(events);
      const result = await service.findByBimestre(1);
      expect(result.length).toBe(1);
      expect(mockEventRepository.find).toHaveBeenCalledWith(expect.objectContaining({ where: { bimestre_id: 1, active: true } }));
    });
  });

  // Pruebas para getEventStats()
  describe('getEventStats', () => {
    it('debería retornar las estadísticas del dashboard', async () => {
      mockEventRepository.count.mockResolvedValue(10); // totalEvents
      mockEventRepository.query.mockResolvedValueOnce([{ count: 5 }]); // activeTeachers
      mockEventRepository.query.mockResolvedValueOnce([{ count: 3 }]); // usedRooms

      const result = await service.getEventStats();
      expect(result).toEqual({
        totalEvents: 10,
        activeTeachers: 5,
        usedRooms: 3,
      });
    });
  });
});
