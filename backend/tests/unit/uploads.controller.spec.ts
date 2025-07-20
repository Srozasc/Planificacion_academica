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
            processDol: jest.fn(),
            processVacantesInicio: jest.fn(),
            processEstructuraAcademica: jest.fn(),
            processReporteCursables: jest.fn(),
            processNominaDocentes: jest.fn(),
            getSystemStats: jest.fn(),
            getSystemHealth: jest.fn(),
        
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

  describe('uploadDol', () => {
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

    it('should successfully upload and process DOL file', async () => {
      const mockBody = { bimestreId: '1', mode: 'UPSERT', validateOnly: 'false' };
      const mockResult = { summary: { totalRecords: 15, validRecords: 15, invalidRecords: 0 } };
      (uploadService.processDol as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.uploadDol(mockFile, mockBody);

      expect(uploadService.processDol).toHaveBeenCalledWith(
        mockFile,
        { mode: 'UPSERT', validateOnly: false, bimestreId: 1 },
      );
      expect(responseService.success).toHaveBeenCalledWith(
        mockResult,
        'DOL - Cargos docentes cargados exitosamente',
      );
      expect(result.success).toBe(true);
    });

    it('should successfully validate DOL file', async () => {
      const mockBody = { bimestreId: '1', mode: 'UPSERT', validateOnly: 'true' };
      const mockResult = { summary: { totalRecords: 15, validRecords: 15, invalidRecords: 0 } };
      (uploadService.processDol as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.uploadDol(mockFile, mockBody);

      expect(uploadService.processDol).toHaveBeenCalledWith(
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

      const result = await controller.uploadDol(null, mockBody);

      expect(responseService.error).toHaveBeenCalledWith(
        'Error al procesar DOL - Cargos docentes',
        ['No se ha proporcionado ningún archivo'],
      );
      expect(result.success).toBe(false);
    });

    it('should throw BadRequestException if bimestreId is missing', async () => {
      const mockBody = { mode: 'UPSERT' };

      const result = await controller.uploadDol(mockFile, mockBody as any);

      expect(responseService.error).toHaveBeenCalledWith(
        'Error al procesar DOL - Cargos docentes',
        ['El ID del bimestre es requerido'],
      );
      expect(result.success).toBe(false);
    });

    it('should throw BadRequestException if bimestreId is invalid', async () => {
      const mockBody = { bimestreId: 'abc' };

      const result = await controller.uploadDol(mockFile, mockBody as any);

      expect(responseService.error).toHaveBeenCalledWith(
        'Error al procesar DOL - Cargos docentes',
        ['El ID del bimestre debe ser un número válido'],
      );
      expect(result.success).toBe(false);
    });

    it('should handle errors during DOL processing', async () => {
      const mockBody = { bimestreId: '1' };
      const errorMessage = 'Database connection error';
      (uploadService.processDol as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const result = await controller.uploadDol(mockFile, mockBody);

      expect(responseService.error).toHaveBeenCalledWith(
        'Error al procesar DOL - Cargos docentes',
        [errorMessage],
      );
      expect(result.success).toBe(false);
    });
  });

  describe('uploadVacantesInicio', () => {
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

    it('should successfully upload and process Vacantes Inicio file', async () => {
      const mockBody = { bimestreId: '1', mode: 'UPSERT', validateOnly: 'false' };
      const mockResult = { summary: { totalRecords: 20, validRecords: 20, invalidRecords: 0 } };
      (uploadService.processVacantesInicio as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.uploadVacantesInicio(mockFile, mockBody);

      expect(uploadService.processVacantesInicio).toHaveBeenCalledWith(
        mockFile,
        { mode: 'UPSERT', validateOnly: false, bimestreId: 1 },
      );
      expect(responseService.success).toHaveBeenCalledWith(
        mockResult,
        'Vacantes Inicio cargadas exitosamente',
      );
      expect(result.success).toBe(true);
    });

    it('should successfully validate Vacantes Inicio file', async () => {
      const mockBody = { bimestreId: '1', mode: 'UPSERT', validateOnly: 'true' };
      const mockResult = { summary: { totalRecords: 20, validRecords: 20, invalidRecords: 0 } };
      (uploadService.processVacantesInicio as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.uploadVacantesInicio(mockFile, mockBody);

      expect(uploadService.processVacantesInicio).toHaveBeenCalledWith(
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

      const result = await controller.uploadVacantesInicio(null, mockBody);

      expect(responseService.error).toHaveBeenCalledWith(
        'Error al procesar Vacantes Inicio',
        ['No se ha proporcionado ningún archivo'],
      );
      expect(result.success).toBe(false);
    });

    it('should throw BadRequestException if bimestreId is missing', async () => {
      const mockBody = { mode: 'UPSERT' };

      const result = await controller.uploadVacantesInicio(mockFile, mockBody as any);

      expect(responseService.error).toHaveBeenCalledWith(
        'Error al procesar Vacantes Inicio',
        ['El ID del bimestre es requerido'],
      );
      expect(result.success).toBe(false);
    });

    it('should throw BadRequestException if bimestreId is invalid', async () => {
      const mockBody = { bimestreId: 'abc' };

      const result = await controller.uploadVacantesInicio(mockFile, mockBody as any);

      expect(responseService.error).toHaveBeenCalledWith(
        'Error al procesar Vacantes Inicio',
        ['El ID del bimestre debe ser un número válido'],
      );
      expect(result.success).toBe(false);
    });

    it('should handle errors during Vacantes Inicio processing', async () => {
       const mockBody = { bimestreId: '1' };
       const errorMessage = 'Database connection error';
       (uploadService.processVacantesInicio as jest.Mock).mockRejectedValue(new Error(errorMessage));

       const result = await controller.uploadVacantesInicio(mockFile, mockBody);

       expect(responseService.error).toHaveBeenCalledWith(
         'Error al procesar Vacantes Inicio',
         [errorMessage],
       );
       expect(result.success).toBe(false);
     });
   });

   describe('uploadEstructuraAcademica', () => {
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

     it('should successfully upload and process Estructura Academica file', async () => {
       const mockBody = { bimestreId: '1', mode: 'UPSERT', validateOnly: 'false' };
       const mockResult = { summary: { totalRecords: 25, validRecords: 25, invalidRecords: 0 } };
       (uploadService.processEstructuraAcademica as jest.Mock).mockResolvedValue(mockResult);

       const result = await controller.uploadEstructuraAcademica(mockFile, mockBody);

       expect(uploadService.processEstructuraAcademica).toHaveBeenCalledWith(
         mockFile,
         { mode: 'UPSERT', validateOnly: false, bimestreId: 1 },
       );
       expect(responseService.success).toHaveBeenCalledWith(
         mockResult,
         'Estructura Académica cargada exitosamente',
       );
       expect(result.success).toBe(true);
     });

     it('should successfully validate Estructura Academica file', async () => {
       const mockBody = { bimestreId: '1', mode: 'UPSERT', validateOnly: 'true' };
       const mockResult = { summary: { totalRecords: 25, validRecords: 25, invalidRecords: 0 } };
       (uploadService.processEstructuraAcademica as jest.Mock).mockResolvedValue(mockResult);

       const result = await controller.uploadEstructuraAcademica(mockFile, mockBody);

       expect(uploadService.processEstructuraAcademica).toHaveBeenCalledWith(
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

       const result = await controller.uploadEstructuraAcademica(null, mockBody);

       expect(responseService.error).toHaveBeenCalledWith(
         'Error al procesar Estructura Académica',
         ['No se ha proporcionado ningún archivo'],
       );
       expect(result.success).toBe(false);
     });

     it('should throw BadRequestException if bimestreId is missing', async () => {
       const mockBody = { mode: 'UPSERT' };

       const result = await controller.uploadEstructuraAcademica(mockFile, mockBody as any);

       expect(responseService.error).toHaveBeenCalledWith(
         'Error al procesar Estructura Académica',
         ['El ID del bimestre es requerido'],
       );
       expect(result.success).toBe(false);
     });

     it('should throw BadRequestException if bimestreId is invalid', async () => {
       const mockBody = { bimestreId: 'abc' };

       const result = await controller.uploadEstructuraAcademica(mockFile, mockBody as any);

       expect(responseService.error).toHaveBeenCalledWith(
         'Error al procesar Estructura Académica',
         ['El ID del bimestre debe ser un número válido'],
       );
       expect(result.success).toBe(false);
     });

     it('should handle errors during Estructura Academica processing', async () => {
       const mockBody = { bimestreId: '1' };
       const errorMessage = 'Database connection error';
       (uploadService.processEstructuraAcademica as jest.Mock).mockRejectedValue(new Error(errorMessage));

       const result = await controller.uploadEstructuraAcademica(mockFile, mockBody);

       expect(responseService.error).toHaveBeenCalledWith(
         'Error al procesar Estructura Académica',
         [errorMessage],
       );
       expect(result.success).toBe(false);
     });
   });

   describe('uploadReporteCursables', () => {
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

     it('should successfully upload and process Reporte Cursables file', async () => {
       const mockBody = { bimestreId: '1', mode: 'full', validateOnly: 'false' };
       const mockResult = { success: true, message: 'Reporte Cursables procesado exitosamente', summary: { totalRecords: 30, validRecords: 30, invalidRecords: 0 } };
       (uploadService.processReporteCursables as jest.Mock).mockResolvedValue(mockResult);

       const result = await controller.uploadReporteCursables(mockFile, mockBody);

       expect(uploadService.processReporteCursables).toHaveBeenCalledWith(
         mockFile,
         { mode: 'full', validateOnly: false, bimestreId: 1 },
       );
       expect(responseService.success).toHaveBeenCalledWith(
         mockResult,
         'Reporte Cursables procesado exitosamente',
       );
       expect(result.success).toBe(true);
     });

     it('should throw BadRequestException if no file is provided', async () => {
       const mockBody = { bimestreId: '1' };

       const result = await controller.uploadReporteCursables(null, mockBody);

       expect(responseService.error).toHaveBeenCalledWith(
         'Error interno del servidor al procesar Reporte Cursables',
         ['No se ha proporcionado ningún archivo'],
       );
       expect(result.success).toBe(false);
     });

     it('should throw BadRequestException if bimestreId is missing', async () => {
       const mockBody = { mode: 'full' };

       const result = await controller.uploadReporteCursables(mockFile, mockBody as any);

       expect(responseService.error).toHaveBeenCalledWith(
         'Error interno del servidor al procesar Reporte Cursables',
         ['BimestreId es requerido'],
       );
       expect(result.success).toBe(false);
     });

     it('should throw BadRequestException if bimestreId is invalid', async () => {
       const mockBody = { bimestreId: 'abc' };

       const result = await controller.uploadReporteCursables(mockFile, mockBody as any);

       expect(responseService.error).toHaveBeenCalledWith(
         'Error interno del servidor al procesar Reporte Cursables',
         ['BimestreId debe ser un número válido'],
       );
       expect(result.success).toBe(false);
     });

     it('should handle service errors during Reporte Cursables processing', async () => {
       const mockBody = { bimestreId: '1' };
       const mockResult = { success: false, message: 'Error procesando Reporte Cursables', errors: ['Validation error'] };
       (uploadService.processReporteCursables as jest.Mock).mockResolvedValue(mockResult);

       const result = await controller.uploadReporteCursables(mockFile, mockBody);

       expect(responseService.error).toHaveBeenCalledWith(
         'Error procesando Reporte Cursables',
         ['Validation error'],
       );
       expect(result.success).toBe(false);
     });

     it('should handle errors during Reporte Cursables processing', async () => {
       const mockBody = { bimestreId: '1' };
       const errorMessage = 'Database connection error';
       (uploadService.processReporteCursables as jest.Mock).mockRejectedValue(new Error(errorMessage));

       const result = await controller.uploadReporteCursables(mockFile, mockBody);

       expect(responseService.error).toHaveBeenCalledWith(
         'Error interno del servidor al procesar Reporte Cursables',
         [errorMessage],
       );
       expect(result.success).toBe(false);
     });
   });

   describe('uploadNominaDocentes', () => {
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

     it('should successfully upload and process Nomina Docentes file', async () => {
       const mockBody = { bimestreId: '1', mode: 'full', validateOnly: 'false' };
       const mockResult = { success: true, message: 'Nómina Docentes procesada exitosamente', summary: { totalRecords: 35, validRecords: 35, invalidRecords: 0 } };
       (uploadService.processNominaDocentes as jest.Mock).mockResolvedValue(mockResult);

       const result = await controller.uploadNominaDocentes(mockFile, mockBody);

       expect(uploadService.processNominaDocentes).toHaveBeenCalledWith(
         mockFile,
         { mode: 'full', validateOnly: false, bimestreId: 1 },
       );
       expect(responseService.success).toHaveBeenCalledWith(
         mockResult,
         'Nómina Docentes procesada exitosamente',
       );
       expect(result.success).toBe(true);
     });

     it('should throw BadRequestException if no file is provided', async () => {
       const mockBody = { bimestreId: '1' };

       const result = await controller.uploadNominaDocentes(null, mockBody);

       expect(responseService.error).toHaveBeenCalledWith(
         'Error interno del servidor',
         ['No se ha proporcionado ningún archivo'],
       );
       expect(result.success).toBe(false);
     });

     it('should throw BadRequestException if bimestreId is missing', async () => {
       const mockBody = { mode: 'full' };

       const result = await controller.uploadNominaDocentes(mockFile, mockBody as any);

       expect(responseService.error).toHaveBeenCalledWith(
         'Error interno del servidor',
         ['El ID del bimestre es requerido'],
       );
       expect(result.success).toBe(false);
     });

     it('should throw BadRequestException if bimestreId is invalid', async () => {
       const mockBody = { bimestreId: 'abc' };

       const result = await controller.uploadNominaDocentes(mockFile, mockBody as any);

       expect(responseService.error).toHaveBeenCalledWith(
         'Error interno del servidor',
         ['El ID del bimestre debe ser un número válido'],
       );
       expect(result.success).toBe(false);
     });

     it('should handle service errors during Nomina Docentes processing', async () => {
       const mockBody = { bimestreId: '1' };
       const mockResult = { success: false, message: 'Error procesando Nómina Docentes', errors: ['Validation error'] };
       (uploadService.processNominaDocentes as jest.Mock).mockResolvedValue(mockResult);

       const result = await controller.uploadNominaDocentes(mockFile, mockBody);

       expect(responseService.error).toHaveBeenCalledWith(
         'Error procesando Nómina Docentes',
         ['Validation error'],
       );
       expect(result.success).toBe(false);
     });

     it('should handle errors during Nomina Docentes processing', async () => {
       const mockBody = { bimestreId: '1' };
       const errorMessage = 'Database connection error';
       (uploadService.processNominaDocentes as jest.Mock).mockRejectedValue(new Error(errorMessage));

       const result = await controller.uploadNominaDocentes(mockFile, mockBody);

       expect(responseService.error).toHaveBeenCalledWith(
         'Error interno del servidor',
         [errorMessage],
       );
       expect(result.success).toBe(false);
     });
   });
 });
