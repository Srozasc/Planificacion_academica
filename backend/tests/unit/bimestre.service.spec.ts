import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

import { BimestreService, CreateBimestreDto, UpdateBimestreDto } from 'src/common/services/bimestre.service';
import { Bimestre } from 'src/common/entities/bimestre.entity';

// Mock del repositorio de Bimestre
const mockBimestreRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

describe('BimestreService', () => {
  let service: BimestreService;
  let repository: Repository<Bimestre>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BimestreService,
        {
          provide: getRepositoryToken(Bimestre),
          useValue: mockBimestreRepository,
        },
      ],
    }).compile();

    service = module.get<BimestreService>(BimestreService);
    repository = module.get<Repository<Bimestre>>(getRepositoryToken(Bimestre));
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  // Pruebas para findAll()
  describe('findAll', () => {
    it('debería retornar un array de bimestres', async () => {
      const mockBimestres = [{ id: 1, nombre: 'Bimestre 1' }];
      mockBimestreRepository.find.mockResolvedValue(mockBimestres);

      const result = await service.findAll();
      expect(result).toEqual(mockBimestres);
      expect(repository.find).toHaveBeenCalledWith({ order: { anoAcademico: 'DESC', numeroBimestre: 'ASC' } });
    });
  });

  // Pruebas para findById()
  describe('findById', () => {
    it('debería retornar un bimestre por ID', async () => {
      const mockBimestre = { id: 1, nombre: 'Bimestre Test' };
      mockBimestreRepository.findOne.mockResolvedValue(mockBimestre);

      const result = await service.findById(1);
      expect(result).toEqual(mockBimestre);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('debería lanzar NotFoundException si el bimestre no existe', async () => {
      mockBimestreRepository.findOne.mockResolvedValue(null);
      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });
  });

  // Pruebas para create()
  describe('create', () => {
    const createBimestreDto: CreateBimestreDto = {
      nombre: 'Nuevo Bimestre',
      fechaInicio: '2025-01-01',
      fechaFin: '2025-03-31',
      anoAcademico: 2025,
      numeroBimestre: 1,
    };

    it('debería crear un bimestre exitosamente', async () => {
      mockBimestreRepository.findOne.mockResolvedValue(null); // No existe bimestre con mismo numero/año
      mockBimestreRepository.find.mockResolvedValue([]); // No hay solapamiento
      mockBimestreRepository.create.mockImplementation(dto => dto);
      mockBimestreRepository.save.mockResolvedValue({ id: 1, ...createBimestreDto });

      const result = await service.create(createBimestreDto);
      expect(result).toBeDefined();
      expect(result.nombre).toBe('Nuevo Bimestre');
      expect(repository.save).toHaveBeenCalled();
    });

    it('debería lanzar BadRequestException si la fecha de inicio es posterior a la de fin', async () => {
      const invalidDto = { ...createBimestreDto, fechaInicio: '2025-04-01' };
      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar BadRequestException si ya existe un bimestre con el mismo número y año', async () => {
      mockBimestreRepository.findOne.mockResolvedValue({ id: 1, ...createBimestreDto });
      await expect(service.create(createBimestreDto)).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar BadRequestException si hay solapamiento de fechas', async () => {
      mockBimestreRepository.findOne.mockResolvedValue(null); // No existe bimestre con mismo numero/año
      mockBimestreRepository.find.mockResolvedValue([
        { id: 2, nombre: 'Bimestre Existente', fechaInicio: new Date('2025-03-01'), fechaFin: new Date('2025-05-31'), activo: true }
      ]); // Simula solapamiento

      await expect(service.create(createBimestreDto)).rejects.toThrow(BadRequestException);
    });
  });

  // Pruebas para update()
  describe('update', () => {
    const updateBimestreDto: UpdateBimestreDto = { nombre: 'Bimestre Actualizado' };
    const existingBimestre = {
      id: 1,
      nombre: 'Bimestre Original',
      fechaInicio: new Date('2025-01-01'),
      fechaFin: new Date('2025-03-31'),
      anoAcademico: 2025,
      numeroBimestre: 1,
      activo: true,
      contieneFecha: jest.fn(),
    };

    it('debería actualizar un bimestre exitosamente', async () => {
      mockBimestreRepository.findOne.mockResolvedValue(existingBimestre);
      mockBimestreRepository.find.mockResolvedValue([]); // No hay solapamiento
      mockBimestreRepository.save.mockImplementation(bim => bim);

      const result = await service.update(1, updateBimestreDto);
      expect(result).toBeDefined();
      expect(result.nombre).toBe('Bimestre Actualizado');
      expect(repository.save).toHaveBeenCalled();
    });

    it('debería lanzar NotFoundException si el bimestre a actualizar no existe', async () => {
      mockBimestreRepository.findOne.mockResolvedValue(null);
      await expect(service.update(99, updateBimestreDto)).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar BadRequestException si la fecha de inicio actualizada es posterior a la de fin', async () => {
      const invalidUpdateDto = { ...updateBimestreDto, fechaInicio: '2025-04-01', fechaFin: '2025-03-31' };
      mockBimestreRepository.findOne.mockResolvedValue(existingBimestre);
      await expect(service.update(1, invalidUpdateDto)).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar BadRequestException si hay solapamiento de fechas al actualizar', async () => {
      mockBimestreRepository.findOne.mockResolvedValue(existingBimestre);
      mockBimestreRepository.find.mockResolvedValue([
        { id: 2, nombre: 'Otro Bimestre', fechaInicio: new Date('2025-03-01'), fechaFin: new Date('2025-05-31'), activo: true }
      ]);
      await expect(service.update(1, { fechaInicio: '2025-04-01' })).rejects.toThrow(BadRequestException);
    });
  });

  // Pruebas para delete()
  describe('delete', () => {
    it('debería eliminar un bimestre exitosamente', async () => {
      mockBimestreRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(1);
      expect(repository.delete).toHaveBeenCalledWith(1);
    });

    it('debería lanzar NotFoundException si el bimestre a eliminar no existe', async () => {
      mockBimestreRepository.delete.mockResolvedValue({ affected: 0 });
      await expect(service.delete(99)).rejects.toThrow(NotFoundException);
    });
  });

  // Pruebas para findBimestreByFecha()
  describe('findBimestreByFecha', () => {
    it('debería retornar el bimestre que contiene la fecha', async () => {
      const mockBimestres = [
        { id: 1, nombre: 'Bimestre 1', fechaInicio: new Date('2025-01-01'), fechaFin: new Date('2025-03-31'), activo: true, contieneFecha: (date: Date) => date >= new Date('2025-01-01') && date <= new Date('2025-03-31') },
        { id: 2, nombre: 'Bimestre 2', fechaInicio: new Date('2025-04-01'), fechaFin: new Date('2025-06-30'), activo: true, contieneFecha: (date: Date) => date >= new Date('2025-04-01') && date <= new Date('2025-06-30') },
      ];
      mockBimestreRepository.find.mockResolvedValue(mockBimestres); // Para findActivos

      const testDate = new Date('2025-02-15');
      const result = await service.findBimestreByFecha(testDate);

      expect(result).toEqual(mockBimestres[0]);
    });

    it('debería retornar null si ninguna bimestre contiene la fecha', async () => {
      const mockBimestres = [
        { id: 1, nombre: 'Bimestre 1', fechaInicio: new Date('2025-01-01'), fechaFin: new Date('2025-03-31'), activo: true, contieneFecha: (date: Date) => false },
      ];
      mockBimestreRepository.find.mockResolvedValue(mockBimestres);

      const testDate = new Date('2025-07-15');
      const result = await service.findBimestreByFecha(testDate);

      expect(result).toBeNull();
    });
  });
});
