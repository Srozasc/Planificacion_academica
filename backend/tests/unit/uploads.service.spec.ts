import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';

import { UploadService } from 'src/uploads/uploads.service';
import { StagingAdolSimple } from 'src/adol/entities/adol-position.entity';
import { StagingDol } from 'src/dol/entities/dol-position.entity';
import { StagingVacantesInicio } from 'src/vacantes-inicio/entities/vacantes-inicio.entity';
import { StagingEstructuraAcademica } from 'src/estructura-academica/entities/estructura-academica.entity';
import { StagingReporteCursables } from 'src/reporte-cursables/entities/reporte-cursables.entity';
import { StagingNominaDocentes } from 'src/nomina-docentes/entities/nomina-docentes.entity';
import { ResponseService } from 'src/common/services/response.service';

// Mocks para los repositorios
const mockRepository = {
  clear: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
  count: jest.fn().mockResolvedValue(5),
  createQueryBuilder: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ count: 0 }),
  })),
};

const mockResponseService = {
  success: jest.fn((data, message) => ({ success: true, data, message })),
  error: jest.fn((message, errors) => ({ success: false, message, errors })),
};

// Mock de XLSX
jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn(),
  },
}));

describe('UploadService', () => {
  let service: UploadService;
  let stagingAdolRepository: Repository<StagingAdolSimple>;
  let stagingDolRepository: Repository<StagingDol>;
  let stagingVacantesInicioRepository: Repository<StagingVacantesInicio>;
  let stagingEstructuraAcademicaRepository: Repository<StagingEstructuraAcademica>;
  let stagingReporteCursablesRepository: Repository<StagingReporteCursables>;
  let stagingNominaDocentesRepository: Repository<StagingNominaDocentes>;
  let responseService: ResponseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: getRepositoryToken(StagingAdolSimple),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(StagingDol),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(StagingVacantesInicio),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(StagingEstructuraAcademica),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(StagingReporteCursables),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(StagingNominaDocentes),
          useValue: mockRepository,
        },
        {
          provide: ResponseService,
          useValue: mockResponseService,
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    stagingAdolRepository = module.get<Repository<StagingAdolSimple>>(getRepositoryToken(StagingAdolSimple));
    stagingDolRepository = module.get<Repository<StagingDol>>(getRepositoryToken(StagingDol));
    stagingVacantesInicioRepository = module.get<Repository<StagingVacantesInicio>>(getRepositoryToken(StagingVacantesInicio));
    stagingEstructuraAcademicaRepository = module.get<Repository<StagingEstructuraAcademica>>(getRepositoryToken(StagingEstructuraAcademica));
    stagingReporteCursablesRepository = module.get<Repository<StagingReporteCursables>>(getRepositoryToken(StagingReporteCursables));
    stagingNominaDocentesRepository = module.get<Repository<StagingNominaDocentes>>(getRepositoryToken(StagingNominaDocentes));
    responseService = module.get<ResponseService>(ResponseService);

    // Limpiar todos los mocks antes de cada test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processAdol', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test-adol.xlsx',
      encoding: '7bit',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 1024,
      destination: './uploads/temp',
      filename: 'test-adol-123.xlsx',
      path: './uploads/temp/test-adol-123.xlsx',
      buffer: Buffer.from('mock excel data'),
      stream: null,
    };

    const mockOptions = {
      mode: 'UPSERT',
      validateOnly: false,
      bimestreId: 1,
    };

    beforeEach(() => {
      // Mock XLSX reading
      (XLSX.read as jest.Mock).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: {},
        },
      });

      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        {
          PLAN: 'PLAN001',
          SIGLA: 'MAT101',
          SECCION: '001',
          DOCENTE: 'Juan Pérez',
          RUT: '12345678-9',
        },
      ]);
    });

    it('should process ADOL file successfully', async () => {
      // Mock repository methods
      mockRepository.clear.mockResolvedValue(undefined);
      mockRepository.create.mockReturnValue({ id: 1 });
      mockRepository.save.mockResolvedValue({ id: 1 });

      // Mock validation method
      jest.spyOn(service as any, 'validateAdolData').mockReturnValue({
        isValid: true,
        validRecords: [{
          plan: 'PLAN001',
          sigla: 'MAT101',
          seccion: '001',
          docente: 'Juan Pérez',
          rut: '12345678-9',
          id_bimestre: 1,
        }],
        errors: [],
      });

      const result = await service.processAdol(mockFile, mockOptions);

      expect(result.success).toBe(true);
      expect(result.message).toContain('ADOL procesado exitosamente');
      expect(stagingAdolRepository.clear).toHaveBeenCalledTimes(1);
      expect(stagingAdolRepository.save).toHaveBeenCalled();
    });

    it('should clear staging table before saving new data', async () => {
      // Mock repository methods
      mockRepository.clear.mockResolvedValue(undefined);
      mockRepository.create.mockReturnValue({ id: 1 });
      mockRepository.save.mockResolvedValue({ id: 1 });

      // Mock validation method
      jest.spyOn(service as any, 'validateAdolData').mockReturnValue({
        isValid: true,
        validRecords: [{
          plan: 'PLAN001',
          sigla: 'MAT101',
          seccion: '001',
          docente: 'Juan Pérez',
          rut: '12345678-9',
          id_bimestre: 1,
        }],
        errors: [],
      });

      await service.processAdol(mockFile, mockOptions);

      // Verificar que clear() se llama antes que save()
      const clearCall = (stagingAdolRepository.clear as jest.Mock).mock.invocationCallOrder[0];
      const saveCall = (stagingAdolRepository.save as jest.Mock).mock.invocationCallOrder[0];
      expect(clearCall).toBeLessThan(saveCall);
    });

    it('should return validation errors when data is invalid', async () => {
      // Mock validation method with errors
      jest.spyOn(service as any, 'validateAdolData').mockReturnValue({
        isValid: false,
        validRecords: [],
        errors: ['RUT inválido en fila 1', 'Sigla faltante en fila 2'],
      });

      const result = await service.processAdol(mockFile, mockOptions);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Errores de validación encontrados');
      expect(result.summary?.errors).toHaveLength(2);
      expect(stagingAdolRepository.clear).not.toHaveBeenCalled();
    });

    it('should only validate when validateOnly is true', async () => {
      const validateOnlyOptions = { ...mockOptions, validateOnly: true };

      // Mock validation method
      jest.spyOn(service as any, 'validateAdolData').mockReturnValue({
        isValid: true,
        validRecords: [{ plan: 'PLAN001' }],
        errors: [],
      });

      const result = await service.processAdol(mockFile, validateOnlyOptions);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Validación completada exitosamente');
      expect(stagingAdolRepository.clear).not.toHaveBeenCalled();
      expect(stagingAdolRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('processDol', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test-dol.xlsx',
      encoding: '7bit',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 1024,
      destination: './uploads/temp',
      filename: 'test-dol-123.xlsx',
      path: './uploads/temp/test-dol-123.xlsx',
      buffer: Buffer.from('mock excel data'),
      stream: null,
    };

    const mockOptions = {
      mode: 'UPSERT',
      validateOnly: false,
      bimestreId: 1,
    };

    beforeEach(() => {
      // Mock XLSX reading
      (XLSX.read as jest.Mock).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: {},
        },
      });

      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        {
          PLAN: 'PLAN001',
          SIGLA: 'MAT101',
          SECCION: '001',
          DOCENTE: 'Juan Pérez',
        },
      ]);
    });

    it('should process DOL file successfully and clear staging table', async () => {
      // Mock repository methods
      mockRepository.clear.mockResolvedValue(undefined);
      mockRepository.save.mockResolvedValue({ id: 1 });

      // Mock validation method
      jest.spyOn(service as any, 'validateDolData').mockReturnValue({
        isValid: true,
        validRecords: [{
          plan: 'PLAN001',
          sigla: 'MAT101',
          seccion: '001',
          docente: 'Juan Pérez',
          id_bimestre: 1,
        }],
        errors: [],
      });

      const result = await service.processDol(mockFile, mockOptions);

      expect(result.success).toBe(true);
      expect(result.message).toContain('DOL procesado exitosamente');
      expect(stagingDolRepository.clear).toHaveBeenCalledTimes(1);
      expect(stagingDolRepository.save).toHaveBeenCalled();
    });
  });

  describe('processVacantesInicio', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test-vacantes.xlsx',
      encoding: '7bit',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 1024,
      destination: './uploads/temp',
      filename: 'test-vacantes-123.xlsx',
      path: './uploads/temp/test-vacantes-123.xlsx',
      buffer: Buffer.from('mock excel data'),
      stream: null,
    };

    const mockOptions = {
      mode: 'UPSERT',
      validateOnly: false,
      bimestreId: 1,
    };

    it('should clear staging table before saving vacantes inicio data', async () => {
      // Mock XLSX reading
      (XLSX.read as jest.Mock).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      });

      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        { PLAN: 'PLAN001', SIGLA: 'MAT101' },
      ]);

      // Mock repository methods
      mockRepository.clear.mockResolvedValue(undefined);
      mockRepository.create.mockReturnValue({ id: 1 });
      mockRepository.save.mockResolvedValue({ id: 1 });

      // Mock validation method
      jest.spyOn(service as any, 'validateVacantesInicioData').mockReturnValue({
        isValid: true,
        validRecords: [{ plan: 'PLAN001', sigla: 'MAT101', id_bimestre: 1 }],
        errors: [],
      });

      await service.processVacantesInicio(mockFile, mockOptions);

      expect(stagingVacantesInicioRepository.clear).toHaveBeenCalledTimes(1);
      const clearCall = (stagingVacantesInicioRepository.clear as jest.Mock).mock.invocationCallOrder[0];
      const saveCall = (stagingVacantesInicioRepository.save as jest.Mock).mock.invocationCallOrder[0];
      expect(clearCall).toBeLessThan(saveCall);
    });
  });

  describe('processEstructuraAcademica', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test-estructura.xlsx',
      encoding: '7bit',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 1024,
      destination: './uploads/temp',
      filename: 'test-estructura-123.xlsx',
      path: './uploads/temp/test-estructura-123.xlsx',
      buffer: Buffer.from('mock excel data'),
      stream: null,
    };

    const mockOptions = {
      mode: 'UPSERT',
      validateOnly: false,
      bimestreId: 1,
    };

    it('should clear staging table before saving estructura academica data', async () => {
      // Mock XLSX reading
      (XLSX.read as jest.Mock).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      });

      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        { PLAN: 'PLAN001', SIGLA: 'MAT101' },
      ]);

      // Mock repository methods
      mockRepository.clear.mockResolvedValue(undefined);
      mockRepository.create.mockReturnValue({ id: 1 });
      mockRepository.save.mockResolvedValue({ id: 1 });

      // Mock validation method
      jest.spyOn(service as any, 'validateEstructuraAcademicaData').mockReturnValue({
        isValid: true,
        validRecords: [{ plan: 'PLAN001', sigla: 'MAT101', id_bimestre: 1 }],
        errors: [],
      });

      await service.processEstructuraAcademica(mockFile, mockOptions);

      expect(stagingEstructuraAcademicaRepository.clear).toHaveBeenCalledTimes(1);
    });
  });

  describe('processNominaDocentes', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test-nomina.xlsx',
      encoding: '7bit',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 1024,
      destination: './uploads/temp',
      filename: 'test-nomina-123.xlsx',
      path: './uploads/temp/test-nomina-123.xlsx',
      buffer: Buffer.from('mock excel data'),
      stream: null,
    };

    const mockOptions = {
      mode: 'UPSERT',
      validateOnly: false,
      bimestreId: 1,
    };

    it('should clear staging table before saving nomina docentes data', async () => {
      // Mock XLSX reading
      (XLSX.read as jest.Mock).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      });

      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        { DOCENTE: 'Juan Pérez', RUT: '12345678-9' },
      ]);

      // Mock repository methods
      mockRepository.clear.mockResolvedValue(undefined);
      mockRepository.create.mockReturnValue({ id: 1 });
      mockRepository.save.mockResolvedValue({ id: 1 });

      // Mock validation method
      jest.spyOn(service as any, 'validateNominaDocentesData').mockReturnValue({
        isValid: true,
        validRecords: [{ docente: 'Juan Pérez', rut: '12345678-9', id_bimestre: 1 }],
        errors: [],
      });

      await service.processNominaDocentes(mockFile, mockOptions);

      expect(stagingNominaDocentesRepository.clear).toHaveBeenCalledTimes(1);
      const clearCall = (stagingNominaDocentesRepository.clear as jest.Mock).mock.invocationCallOrder[0];
      const saveCall = (stagingNominaDocentesRepository.save as jest.Mock).mock.invocationCallOrder[0];
      expect(clearCall).toBeLessThan(saveCall);
    });
  });

  describe('Error handling', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test-error.xlsx',
      encoding: '7bit',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 1024,
      destination: './uploads/temp',
      filename: 'test-error-123.xlsx',
      path: './uploads/temp/test-error-123.xlsx',
      buffer: Buffer.from('mock excel data'),
      stream: null,
    };

    const mockOptions = {
      mode: 'UPSERT',
      validateOnly: false,
      bimestreId: 1,
    };

    it('should handle repository clear errors gracefully', async () => {
      // Mock XLSX reading
      (XLSX.read as jest.Mock).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      });

      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        { PLAN: 'PLAN001', SIGLA: 'MAT101' },
      ]);

      // Mock repository clear to throw error
      mockRepository.clear.mockRejectedValue(new Error('Database connection failed'));

      // Mock validation method
      jest.spyOn(service as any, 'validateAdolData').mockReturnValue({
        isValid: true,
        validRecords: [{ plan: 'PLAN001', sigla: 'MAT101', id_bimestre: 1 }],
        errors: [],
      });

      await expect(service.processAdol(mockFile, mockOptions)).rejects.toThrow('Database connection failed');
    });

    it('should handle XLSX reading errors', async () => {
      // Mock XLSX to throw error
      (XLSX.read as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid Excel file');
      });

      await expect(service.processAdol(mockFile, mockOptions)).rejects.toThrow('Invalid Excel file');
    });
  });

  describe('System stats and health', () => {
    it('should return system stats', async () => {
      // Mock repository count methods
      mockRepository.count.mockResolvedValue(5);

      const stats = await service.getSystemStats();

      expect(stats).toBeDefined();
      expect(typeof stats.staging_adol_simple).toBe('number');
      expect(typeof stats.staging_dol).toBe('number');
      expect(typeof stats.staging_vacantes_inicio).toBe('number');
      expect(typeof stats.academic_structures).toBe('number');
      expect(stats.staging_adol_simple).toBe(5);
    });

    it('should return system health', async () => {
      const health = await service.getSystemHealth();

      expect(health).toBeDefined();
      expect(health.status).toBeDefined();
    });
  });


});