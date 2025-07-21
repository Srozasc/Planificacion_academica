import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, Logger } from '@nestjs/common';
import { UploadsController } from 'src/uploads/uploads.controller';
import { UploadService } from 'src/uploads/uploads.service';
import { ResponseService } from 'src/common/services/response.service';

describe('UploadsController', () => {
  let controller: UploadsController;
  let uploadService: UploadService;
  let responseService: ResponseService;

  beforeEach(async () => {
    // Mock del Logger para suprimir logs durante las pruebas
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});

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
            getRecentUploads: jest.fn(),
            getUploadDetails: jest.fn(),
            approveUpload: jest.fn(),
            rejectUpload: jest.fn(),
            getUploadHistory: jest.fn(),
        
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

  afterEach(() => {
    // Limpiar todos los mocks después de cada prueba
    jest.restoreAllMocks();
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
           bimestre: { id: 1, nombre: 'Bimestre 1' },
           user: { id: 1, username: 'testuser' }
         }
       ];

       (uploadService.getRecentUploads as jest.Mock).mockResolvedValue(mockUploads);

       const result = await controller.getRecentUploads();

       expect(uploadService.getRecentUploads).toHaveBeenCalled();
       expect(responseService.success).toHaveBeenCalledWith(
         mockUploads,
         'Cargas recientes obtenidas exitosamente'
       );
       expect(result.success).toBe(true);
     });

     it('should handle errors when getting recent uploads', async () => {
       const errorMessage = 'Database error';
       (uploadService.getRecentUploads as jest.Mock).mockRejectedValue(new Error(errorMessage));

       const result = await controller.getRecentUploads();

       expect(responseService.error).toHaveBeenCalledWith(
         'Error al obtener cargas recientes',
         [errorMessage]
       );
       expect(result.success).toBe(false);
     });
   });

   describe('getUploadDetails', () => {
     it('should return upload details successfully', async () => {
       const uploadId = '1';
       const mockDetails = {
         filename: 'test-adol.xlsx',
         type: 'ADOL',
         validRecords: [],
         invalidRecords: [],
         summary: { totalRecords: 10, validRecords: 8, invalidRecords: 2 }
       };

       (uploadService.getUploadDetails as jest.Mock).mockResolvedValue(mockDetails);

       const result = await controller.getUploadDetails(uploadId);

       expect(uploadService.getUploadDetails).toHaveBeenCalledWith(uploadId);
       expect(responseService.success).toHaveBeenCalledWith(
         mockDetails,
         'Detalles de carga obtenidos exitosamente'
       );
       expect(result.success).toBe(true);
     });

     it('should handle errors when getting upload details', async () => {
       const uploadId = '999';
       const errorMessage = 'No se encontró la carga con ID: 999';
       (uploadService.getUploadDetails as jest.Mock).mockRejectedValue(new Error(errorMessage));

       const result = await controller.getUploadDetails(uploadId);

       expect(responseService.error).toHaveBeenCalledWith(
         'Error al obtener detalles de la carga',
         [errorMessage]
       );
       expect(result.success).toBe(false);
     });
   });

   describe('approveUpload', () => {
     it('should approve upload successfully', async () => {
       const uploadId = '1';
       const body = { userId: 2 };
       const mockApprovedUpload = {
         id: 1,
         fileName: 'test.xlsx',
         approvalStatus: 'Aprobado',
         approvedByUserId: 2,
         approvalDate: new Date()
       };

       (uploadService.approveUpload as jest.Mock).mockResolvedValue(mockApprovedUpload);

       const result = await controller.approveUpload(uploadId, body);

       expect(uploadService.approveUpload).toHaveBeenCalledWith(1, 2);
       expect(responseService.success).toHaveBeenCalledWith(
         mockApprovedUpload,
         'Carga aprobada exitosamente'
       );
       expect(result.success).toBe(true);
     });

     it('should handle errors when approving upload', async () => {
       const uploadId = '1';
       const body = { userId: 2 };
       const errorMessage = 'Carga no encontrada';
       (uploadService.approveUpload as jest.Mock).mockRejectedValue(new Error(errorMessage));

       const result = await controller.approveUpload(uploadId, body);

       expect(responseService.error).toHaveBeenCalledWith(
         'Error al aprobar la carga',
         [errorMessage]
       );
       expect(result.success).toBe(false);
     });
   });

   describe('rejectUpload', () => {
     it('should reject upload successfully', async () => {
       const uploadId = '1';
       const body = { userId: 2, reason: 'Datos incorrectos' };
       const mockRejectedUpload = {
         id: 1,
         fileName: 'test.xlsx',
         approvalStatus: 'Rechazado',
         rejectedByUserId: 2,
         rejectionDate: new Date(),
         rejectionReason: 'Datos incorrectos'
       };

       (uploadService.rejectUpload as jest.Mock).mockResolvedValue(mockRejectedUpload);

       const result = await controller.rejectUpload(uploadId, body);

       expect(uploadService.rejectUpload).toHaveBeenCalledWith(1, 2, 'Datos incorrectos');
       expect(responseService.success).toHaveBeenCalledWith(
         mockRejectedUpload,
         'Carga rechazada exitosamente'
       );
       expect(result.success).toBe(true);
     });

     it('should reject upload without reason', async () => {
       const uploadId = '1';
       const body = { userId: 2 };
       const mockRejectedUpload = {
         id: 1,
         fileName: 'test.xlsx',
         approvalStatus: 'Rechazado',
         rejectedByUserId: 2,
         rejectionDate: new Date()
       };

       (uploadService.rejectUpload as jest.Mock).mockResolvedValue(mockRejectedUpload);

       const result = await controller.rejectUpload(uploadId, body);

       expect(uploadService.rejectUpload).toHaveBeenCalledWith(1, 2, undefined);
       expect(responseService.success).toHaveBeenCalledWith(
         mockRejectedUpload,
         'Carga rechazada exitosamente'
       );
       expect(result.success).toBe(true);
     });

     it('should handle errors when rejecting upload', async () => {
       const uploadId = '1';
       const body = { userId: 2, reason: 'Test reason' };
       const errorMessage = 'Carga no encontrada';
       (uploadService.rejectUpload as jest.Mock).mockRejectedValue(new Error(errorMessage));

       const result = await controller.rejectUpload(uploadId, body);

       expect(responseService.error).toHaveBeenCalledWith(
         'Error al rechazar la carga',
         [errorMessage]
       );
       expect(result.success).toBe(false);
     });
   });

   describe('getUploadHistory', () => {
     it('should return paginated upload history successfully', async () => {
       const query = { page: '1', limit: '10' };
       const mockHistory = {
         data: [
           {
             id: 1,
             fileName: 'test1.xlsx',
             uploadType: 'ADOL',
             uploadDate: new Date(),
             status: 'Exitoso',
             approvalStatus: 'Aprobado'
           }
         ],
         total: 1,
         page: 1,
         limit: 10
       };

       (uploadService.getUploadHistory as jest.Mock).mockResolvedValue(mockHistory);

       const result = await controller.getUploadHistory(query);

       expect(uploadService.getUploadHistory).toHaveBeenCalledWith(1, 10, {});
       expect(responseService.success).toHaveBeenCalledWith(
         mockHistory,
         'Historial de cargas obtenido exitosamente'
       );
       expect(result.success).toBe(true);
     });

     it('should apply filters correctly', async () => {
       const query = {
         page: '1',
         limit: '10',
         uploadType: 'ADOL',
         status: 'Exitoso',
         approvalStatus: 'Aprobado'
       };
       const mockHistory = { data: [], total: 0, page: 1, limit: 10 };

       (uploadService.getUploadHistory as jest.Mock).mockResolvedValue(mockHistory);

       const result = await controller.getUploadHistory(query);

       expect(uploadService.getUploadHistory).toHaveBeenCalledWith(1, 10, {
         uploadType: 'ADOL',
         status: 'Exitoso',
         approvalStatus: 'Aprobado'
       });
       expect(result.success).toBe(true);
     });

     it('should handle errors when getting upload history', async () => {
       const query = { page: '1', limit: '10' };
       const errorMessage = 'Database error';
       (uploadService.getUploadHistory as jest.Mock).mockRejectedValue(new Error(errorMessage));

       const result = await controller.getUploadHistory(query);

       expect(responseService.error).toHaveBeenCalledWith(
         'Error al obtener historial de cargas',
         [errorMessage]
       );
       expect(result.success).toBe(false);
     });
   });

   describe('getSystemStats', () => {
     it('should return system stats successfully', async () => {
       const mockStats = {
         staging_adol_simple: 10,
         staging_dol: 15,
         staging_vacantes_inicio: 20,
         academic_structures: 5
       };

       (uploadService.getSystemStats as jest.Mock).mockResolvedValue(mockStats);

       const result = await controller.getSystemStats();

       expect(uploadService.getSystemStats).toHaveBeenCalled();
       expect(responseService.success).toHaveBeenCalledWith(
         mockStats,
         'Estadísticas del sistema obtenidas exitosamente'
       );
       expect(result.success).toBe(true);
     });

     it('should handle errors when getting system stats', async () => {
       const errorMessage = 'Database error';
       (uploadService.getSystemStats as jest.Mock).mockRejectedValue(new Error(errorMessage));

       const result = await controller.getSystemStats();

       expect(responseService.error).toHaveBeenCalledWith(
         'Error al obtener estadísticas del sistema',
         [errorMessage]
       );
       expect(result.success).toBe(false);
     });
   });

   describe('getSystemHealth', () => {
     it('should return system health successfully', async () => {
       const mockHealth = {
         status: 'healthy',
         timestamp: new Date(),
         uptime: 3600
       };

       (uploadService.getSystemHealth as jest.Mock).mockResolvedValue(mockHealth);

       const result = await controller.getSystemHealth();

       expect(uploadService.getSystemHealth).toHaveBeenCalled();
       expect(responseService.success).toHaveBeenCalledWith(
         mockHealth,
         'Estado del sistema obtenido exitosamente'
       );
       expect(result.success).toBe(true);
     });

     it('should handle errors when getting system health', async () => {
       const errorMessage = 'Health check failed';
       (uploadService.getSystemHealth as jest.Mock).mockRejectedValue(new Error(errorMessage));

       const result = await controller.getSystemHealth();

       expect(responseService.error).toHaveBeenCalledWith(
         'Error al verificar estado del sistema',
         [errorMessage]
       );
       expect(result.success).toBe(false);
     });
   });
 });
