import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UploadsController } from 'src/uploads/uploads.controller';
import { UploadService } from 'src/uploads/uploads.service';
import { ResponseService } from 'src/common/services/response.service';

describe('UploadsController', () => {
  let controller: UploadsController;
  let uploadService: UploadService;
  let responseService: ResponseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        {
          provide: UploadService,
          useValue: {
            processAdol: jest.fn(),
            getSystemStats: jest.fn(),
            getSystemHealth: jest.fn(),
            cleanupFiles: jest.fn(),
          },
        },
        {
          provide: ResponseService,
          useValue: {
            success: jest.fn((data, message) => ({ success: true, data, message })),
            error: jest.fn((message, errors) => ({ success: false, message, errors })),
          },
        },
      ],
    }).compile();

    controller = module.get<UploadsController>(UploadsController);
    uploadService = module.get<UploadService>(UploadService);
    responseService = module.get<ResponseService>(ResponseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadAdol', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test.xlsx',
      encoding: '7bit',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 1024,
      destination: './uploads/temp',
      filename: 'test-123.xlsx',
      path: './uploads/temp/test-123.xlsx',
      buffer: Buffer.from(''),
      stream: null,
    };

    it('should successfully upload and process ADOL file', async () => {
      const mockBody = { bimestreId: '1', mode: 'UPSERT', validateOnly: 'false' };
      const mockResult = { summary: { totalRecords: 10, validRecords: 10, invalidRecords: 0 } };
      (uploadService.processAdol as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.uploadAdol(mockFile, mockBody);

      expect(uploadService.processAdol).toHaveBeenCalledWith(
        mockFile,
        { mode: 'UPSERT', validateOnly: false, bimestreId: 1 },
      );
      expect(responseService.success).toHaveBeenCalledWith(
        mockResult,
        'ADOL - Cargos docentes cargados exitosamente',
      );
      expect(result.success).toBe(true);
    });

    it('should successfully validate ADOL file', async () => {
      const mockBody = { bimestreId: '1', mode: 'UPSERT', validateOnly: 'true' };
      const mockResult = { summary: { totalRecords: 10, validRecords: 10, invalidRecords: 0 } };
      (uploadService.processAdol as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.uploadAdol(mockFile, mockBody);

      expect(uploadService.processAdol).toHaveBeenCalledWith(
        mockFile,
        { mode: 'UPSERT', validateOnly: true, bimestreId: 1 },
      );
      expect(responseService.success).toHaveBeenCalledWith(
        mockResult,
        'Archivo validado exitosamente',
      );
      expect(result.success).toBe(true);
    });

    it('should throw BadRequestException if no file is provided', async () => {
      const mockBody = { bimestreId: '1' };

      const result = await controller.uploadAdol(null, mockBody);

      expect(responseService.error).toHaveBeenCalledWith(
        'Error al procesar ADOL - Cargos docentes',
        ['No se ha proporcionado ningún archivo'],
      );
      expect(result.success).toBe(false);
    });

    it('should throw BadRequestException if bimestreId is missing', async () => {
      const mockBody = { mode: 'UPSERT' };

      const result = await controller.uploadAdol(mockFile, mockBody as any);

      expect(responseService.error).toHaveBeenCalledWith(
        'Error al procesar ADOL - Cargos docentes',
        ['El ID del bimestre es requerido'],
      );
      expect(result.success).toBe(false);
    });

    it('should throw BadRequestException if bimestreId is invalid', async () => {
      const mockBody = { bimestreId: 'abc' };

      const result = await controller.uploadAdol(mockFile, mockBody as any);

      expect(responseService.error).toHaveBeenCalledWith(
        'Error al procesar ADOL - Cargos docentes',
        ['El ID del bimestre debe ser un número válido'],
      );
      expect(result.success).toBe(false);
    });

    it('should handle errors during ADOL processing', async () => {
      const mockBody = { bimestreId: '1' };
      const errorMessage = 'Database connection error';
      (uploadService.processAdol as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const result = await controller.uploadAdol(mockFile, mockBody);

      expect(responseService.error).toHaveBeenCalledWith(
        'Error al procesar ADOL - Cargos docentes',
        [errorMessage],
      );
      expect(result.success).toBe(false);
    });
  });
});
