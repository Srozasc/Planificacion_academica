import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';

import { UploadService } from 'src/uploads/uploads.service';
import { StagingAdolSimple } from 'src/adol/entities/adol-position.entity';
import { StagingDol } from 'src/dol/entities/dol-position.entity';
import { StagingVacantesInicio } from 'src/vacantes-inicio/entities/vacantes-inicio.entity';
import { StagingEstructuraAcademica } from 'src/estructura-academica/entities/estructura-academica.entity';
import { StagingReporteCursables } from 'src/reporte-cursables/entities/reporte-cursables.entity';
import { StagingNominaDocentes } from 'src/nomina-docentes/entities/nomina-docentes.entity';
import { UploadLog } from 'src/uploads/entities/upload-log.entity';
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
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getMany: jest.fn().mockResolvedValue([]),
  })),
};

const mockUploadLogRepository = {
  ...mockRepository,
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getMany: jest.fn().mockResolvedValue([]),
    getCount: jest.fn().mockResolvedValue(0),
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
  let uploadLogRepository: Repository<UploadLog>;
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
          provide: getRepositoryToken(UploadLog),
          useValue: mockUploadLogRepository,
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
    uploadLogRepository = module.get<Repository<UploadLog>>(getRepositoryToken(UploadLog));
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

  describe('getRecentUploads', () => {
    it('should return recent uploads successfully', async () => {
      const mockUploads = [
        {
          id: 1,
          fileName: 'test-adol.xlsx',
          uploadType: 'ADOL',
          uploadDate: new Date(),
          status: 'Exitoso',
          approvalStatus: 'Pendiente',
          isProcessed: false,
          totalRecords: 10,
          errorCount: 0,
          bimestre: { id: 1, nombre: 'Bimestre 1' },
          user: { id: 1, name: 'testuser' },
          approvedBy: null,
          approvedAt: null
        },
        {
          id: 2,
          fileName: 'test-dol.xlsx',
          uploadType: 'DOL',
          uploadDate: new Date(),
          status: 'Con errores',
          approvalStatus: 'Aprobado',
          isProcessed: true,
          totalRecords: 5,
          errorCount: 1,
          bimestre: { id: 2, nombre: 'Bimestre 2' },
          user: { id: 2, name: 'testuser2' },
          approvedBy: { id: 3, name: 'approver' },
          approvedAt: new Date()
        }
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockUploads, 2]),
        getMany: jest.fn().mockResolvedValue(mockUploads),
        getCount: jest.fn().mockResolvedValue(2),
      };
      
      mockUploadLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getRecentUploads();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('file_name');
      expect(result[0]).toHaveProperty('upload_type');
      expect(mockUploadLogRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it('should handle errors when getting recent uploads', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        getMany: jest.fn().mockRejectedValue(new Error('Database error')),
        getCount: jest.fn().mockResolvedValue(0),
      };
      
      mockUploadLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.getRecentUploads()).rejects.toThrow('Database error');
    });
  });

  describe('getUploadDetails', () => {
    it('should return upload details successfully for ADOL type', async () => {
      const mockUploadLog = {
        id: 1,
        uploadType: 'ADOL',
        fileName: 'test-adol.xlsx',
        uploadDate: new Date(),
        bimestre: { id: 1, nombre: 'Bimestre 1' }
      };

      const mockStagingData = [
        {
          rowNumber: 1,
          plan: 'PLAN001',
          sigla: 'MAT101',
          seccion: '001',
          docente: 'Juan Pérez',
          rut: '12345678-9',
          id_bimestre: 1
        }
      ];

      mockUploadLogRepository.findOne.mockResolvedValue(mockUploadLog);
      mockRepository.find.mockResolvedValue(mockStagingData);

      const result = await service.getUploadDetails('1');

      expect(result).toBeDefined();
      expect(result.filename).toBe('test-adol.xlsx');
      expect(result.type).toBe('ADOL');
      expect(Array.isArray(result.validRecords)).toBe(true);
      expect(Array.isArray(result.invalidRecords)).toBe(true);
      expect(mockUploadLogRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['bimestre']
      });
    });

    it('should throw error when upload not found', async () => {
      mockUploadLogRepository.findOne.mockResolvedValue(null);

      await expect(service.getUploadDetails('999')).rejects.toThrow('No se encontró la carga con ID: 999');
    });

    it('should handle unsupported upload types', async () => {
      const mockUploadLog = {
        id: 1,
        uploadType: 'UNSUPPORTED_TYPE',
        fileName: 'test.xlsx',
        uploadDate: new Date(),
        bimestre: { id: 1, nombre: 'Bimestre 1' }
      };

      mockUploadLogRepository.findOne.mockResolvedValue(mockUploadLog);

      const result = await service.getUploadDetails('1');
      
      expect(result).toBeDefined();
      expect(result.filename).toBe('test.xlsx');
      expect(result.type).toBe('UNSUPPORTED_TYPE');
      expect(result.validRecords).toEqual([]);
      expect(result.invalidRecords).toEqual([]);
    });
  });

  describe('approveUpload', () => {
    it('should approve upload successfully', async () => {
      const mockUpload = {
        id: 1,
        fileName: 'test.xlsx',
        approvalStatus: 'Pendiente',
        bimestre: { id: 1, nombre: 'Bimestre 1' },
        user: { id: 1, username: 'testuser' }
      };

      const mockApprovedUpload = {
        ...mockUpload,
        approvalStatus: 'Aprobado',
        approvedByUserId: 2,
        approvalDate: new Date()
      };

      mockUploadLogRepository.findOne.mockResolvedValue(mockUpload);
      mockUploadLogRepository.save.mockResolvedValue(mockApprovedUpload);

      const result = await service.approveUpload(1, 2);

      expect(result).toBeDefined();
      expect(result.approvalStatus).toBe('Aprobado');
      expect(mockUploadLogRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['bimestre', 'user']
      });
      expect(mockUploadLogRepository.save).toHaveBeenCalled();
    });

    it('should throw error when upload not found', async () => {
      mockUploadLogRepository.findOne.mockResolvedValue(null);

      await expect(service.approveUpload(999, 2)).rejects.toThrow(BadRequestException);
    });

    it('should throw error when upload already approved', async () => {
      const mockUpload = {
        id: 1,
        approvalStatus: 'Aprobado',
        bimestre: { id: 1 },
        user: { id: 1 }
      };

      mockUploadLogRepository.findOne.mockResolvedValue(mockUpload);

      await expect(service.approveUpload(1, 2)).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectUpload', () => {
    it('should reject upload successfully', async () => {
      const mockUpload = {
        id: 1,
        fileName: 'test.xlsx',
        approvalStatus: 'Pendiente',
        bimestre: { id: 1, nombre: 'Bimestre 1' },
        user: { id: 1, username: 'testuser' }
      };

      const mockRejectedUpload = {
        ...mockUpload,
        approvalStatus: 'Rechazado',
        rejectedByUserId: 2,
        rejectionDate: new Date(),
        rejectionReason: 'Datos incorrectos'
      };

      mockUploadLogRepository.findOne.mockResolvedValue(mockUpload);
      mockUploadLogRepository.save.mockResolvedValue(mockRejectedUpload);

      const result = await service.rejectUpload(1, 2, 'Datos incorrectos');

      expect(result).toBeDefined();
      expect(result.approvalStatus).toBe('Rechazado');
      expect(result.rejectionReason).toBe('Datos incorrectos');
      expect(mockUploadLogRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['bimestre', 'user']
      });
      expect(mockUploadLogRepository.save).toHaveBeenCalled();
    });

    it('should throw error when upload not found for rejection', async () => {
      mockUploadLogRepository.findOne.mockResolvedValue(null);

      await expect(service.rejectUpload(999, 2, 'Test reason')).rejects.toThrow(BadRequestException);
    });

    it('should throw error when upload already rejected', async () => {
      const mockUpload = {
        id: 1,
        approvalStatus: 'Rechazado',
        bimestre: { id: 1 },
        user: { id: 1 }
      };

      mockUploadLogRepository.findOne.mockResolvedValue(mockUpload);

      await expect(service.rejectUpload(1, 2, 'Test reason')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUploadHistory', () => {
    it('should return paginated upload history', async () => {
      const mockUploads = [
        {
          id: 1,
          fileName: 'test1.xlsx',
          uploadType: 'ADOL',
          uploadDate: new Date(),
          status: 'Exitoso',
          approvalStatus: 'Aprobado',
          bimestre: { id: 1, nombre: 'Bimestre 1' },
          user: { id: 1, username: 'user1' }
        },
        {
          id: 2,
          fileName: 'test2.xlsx',
          uploadType: 'DOL',
          uploadDate: new Date(),
          status: 'Con errores',
          approvalStatus: 'Pendiente',
          bimestre: { id: 1, nombre: 'Bimestre 1' },
          user: { id: 2, username: 'user2' }
        }
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockUploads, 2]),
        getMany: jest.fn().mockResolvedValue(mockUploads),
        getCount: jest.fn().mockResolvedValue(2),
      };
      
      mockUploadLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getUploadHistory(1, 10, {});

      expect(result).toBeDefined();
      expect(result).toHaveProperty('uploads');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(Array.isArray(result.uploads)).toBe(true);
      expect(result.uploads.length).toBe(2);
      expect(result.uploads[0]).toHaveProperty('id');
      expect(result.uploads[0]).toHaveProperty('file_name');
      expect(result.uploads[0]).toHaveProperty('upload_type');
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should apply filters correctly', async () => {
      const filters = {
        uploadType: 'ADOL',
        status: 'Exitoso',
        approvalStatus: 'Aprobado'
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        getMany: jest.fn().mockResolvedValue([]),
        getCount: jest.fn().mockResolvedValue(0),
      };
      
      mockUploadLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getUploadHistory(1, 10, filters);

      expect(mockUploadLogRepository.createQueryBuilder).toHaveBeenCalled();
      // El método usa andWhere() directamente para los filtros, no where()
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(3); // Una vez por cada filtro
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('ul.uploadType = :uploadType', { uploadType: 'ADOL' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('ul.status = :status', { status: 'Exitoso' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('ul.approvalStatus = :approvalStatus', { approvalStatus: 'Aprobado' });
    });

    it('should handle database errors in upload history', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        getMany: jest.fn().mockResolvedValue([]),
        getCount: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      
      mockUploadLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.getUploadHistory(1, 10, {})).rejects.toThrow('Database error');
    });
  });


});