import { uploadService } from 'src/features/dataUpload/services/upload.service';

// Mockear el módulo apiClient
jest.mock('src/services/apiClient', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

// Importar apiClient después de que haya sido mockeado
import apiClient from 'src/services/apiClient';

describe('uploadService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should upload a file successfully with ADOL endpoint and bimestreId', async () => {
    const mockFile = new File(['dummy content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const mockOptions = { mode: 'UPSERT', validateOnly: false, bimestreId: 1 };
    const mockResponse = { data: { success: true, message: 'ADOL procesado exitosamente', data: { summary: { totalRecords: 22, validRecords: 22, invalidRecords: 0, errors: [] } } } };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    const result = await uploadService.uploadFile('adol', mockFile, mockOptions);

    expect(apiClient.post).toHaveBeenCalledWith(
      '/uploads/adol',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
    expect(result).toEqual({
      success: true,
      message: 'ADOL procesado exitosamente',
      summary: {
        totalRecords: 22,
        validRecords: 22,
        invalidRecords: 0,
        errors: []
      },
      data: { summary: { totalRecords: 22, validRecords: 22, invalidRecords: 0, errors: [] } }
    });
  });

  it('should validate a file successfully with ADOL endpoint and bimestreId', async () => {
    const mockFile = new File(['dummy content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const mockOptions = { mode: 'UPSERT', validateOnly: true, bimestreId: 1 };
    const mockResponse = { data: { isValid: true, summary: { totalRecords: 22, validRecords: 22, invalidRecords: 0, errors: [] } } };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    const result = await uploadService.validateFile('adol', mockFile);

    expect(apiClient.post).toHaveBeenCalledWith(
      '/uploads/validate/adol',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
    expect(result).toEqual({
      isValid: true,
      summary: {
        totalRecords: 22,
        validRecords: 22,
        invalidRecords: 0,
        errors: []
      }
    });
  });

  it('should handle upload errors', async () => {
    const mockFile = new File(['dummy content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const mockOptions = { bimestreId: 1 };
    const mockError = { response: { data: { message: 'Error al procesar ADOL' } } };

    (apiClient.post as jest.Mock).mockRejectedValue(mockError);

    await expect(uploadService.uploadFile('adol', mockFile, mockOptions)).rejects.toThrow('Error al procesar ADOL');
  });

  it('should handle validation errors', async () => {
    const mockFile = new File(['dummy content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const mockError = { response: { data: { message: 'Error al validar ADOL' } } };

    (apiClient.post as jest.Mock).mockRejectedValue(mockError);

    await expect(uploadService.validateFile('adol', mockFile)).rejects.toThrow('Error al validar ADOL');
  });



  it('should get system stats successfully', async () => {
    const mockResponse = { data: { staging_adol_simple: 10 } };
    (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

    const result = await uploadService.getSystemStats();

    expect(apiClient.get).toHaveBeenCalledWith('/uploads/admin/stats');
    expect(result).toEqual(mockResponse.data);
  });

  it('should get system health successfully', async () => {
    const mockResponse = { data: { status: 'ok' } };
    (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

    const result = await uploadService.getSystemHealth();

    expect(apiClient.get).toHaveBeenCalledWith('/uploads/admin/health');
    expect(result).toEqual(mockResponse.data);
  });



  // Pruebas específicas para el comportamiento de limpieza completa de tablas staging
  describe('Staging table complete replacement behavior', () => {
    it('should upload ADOL data and replace all existing staging data', async () => {
      const mockFile = new File(['dummy content'], 'adol.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const mockOptions = { bimestreId: 1 };
      const mockResponse = {
        data: {
          success: true,
          message: 'ADOL procesado exitosamente - tabla staging completamente reemplazada',
          data: {
            summary: {
              totalRecords: 50,
              validRecords: 50,
              invalidRecords: 0,
              errors: [],
              stagingCleared: true // Indica que la tabla staging fue limpiada completamente
            }
          }
        }
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadService.uploadFile('adol', mockFile, mockOptions);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/uploads/adol',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        }),
      );
      expect(result.success).toBe(true);
      expect(result.summary.totalRecords).toBe(50);
      expect(result.data.summary.stagingCleared).toBe(true);
    });

    it('should upload DOL data and replace all existing staging data', async () => {
      const mockFile = new File(['dummy content'], 'dol.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const mockResponse = {
        data: {
          success: true,
          message: 'DOL procesado exitosamente - tabla staging completamente reemplazada',
          data: {
            summary: {
              totalRecords: 30,
              validRecords: 30,
              invalidRecords: 0,
              errors: [],
              stagingCleared: true
            }
          }
        }
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadService.uploadFile('dol', mockFile);

      expect(result.success).toBe(true);
      expect(result.data.summary.stagingCleared).toBe(true);
    });

    it('should upload Vacantes Inicio data and replace all existing staging data', async () => {
      const mockFile = new File(['dummy content'], 'vacantes.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const mockResponse = {
        data: {
          success: true,
          message: 'Vacantes Inicio procesadas exitosamente - tabla staging completamente reemplazada',
          data: {
            summary: {
              totalRecords: 25,
              validRecords: 25,
              invalidRecords: 0,
              errors: [],
              stagingCleared: true
            }
          }
        }
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadService.uploadFile('vacantes-inicio', mockFile);

      expect(result.success).toBe(true);
      expect(result.data.summary.stagingCleared).toBe(true);
    });

    it('should upload Estructura Academica data and replace all existing staging data', async () => {
      const mockFile = new File(['dummy content'], 'estructura.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const mockOptions = { bimestreId: 1 };
      const mockResponse = {
        data: {
          success: true,
          message: 'Estructura Académica procesada exitosamente - tabla staging completamente reemplazada',
          data: {
            summary: {
              totalRecords: 100,
              validRecords: 100,
              invalidRecords: 0,
              errors: [],
              stagingCleared: true
            }
          }
        }
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadService.uploadFile('estructura-academica', mockFile, mockOptions);

      expect(result.success).toBe(true);
      expect(result.data.summary.stagingCleared).toBe(true);
    });

    it('should upload Nomina Docentes data and replace all existing staging data', async () => {
      const mockFile = new File(['dummy content'], 'nomina.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const mockOptions = { bimestreId: 1 };
      const mockResponse = {
        data: {
          success: true,
          message: 'Nómina Docentes procesada exitosamente - tabla staging completamente reemplazada',
          data: {
            summary: {
              totalRecords: 75,
              validRecords: 75,
              invalidRecords: 0,
              errors: [],
              stagingCleared: true
            }
          }
        }
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadService.uploadFile('nomina-docentes', mockFile, mockOptions);

      expect(result.success).toBe(true);
      expect(result.data.summary.stagingCleared).toBe(true);
    });

    it('should upload Reporte Cursables data and replace all existing staging data', async () => {
      const mockFile = new File(['dummy content'], 'cursables.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const mockResponse = {
        data: {
          success: true,
          message: 'Reporte Cursables procesado exitosamente - tabla staging completamente reemplazada',
          data: {
            summary: {
              totalRecords: 40,
              validRecords: 40,
              invalidRecords: 0,
              errors: [],
              stagingCleared: true
            }
          }
        }
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadService.uploadFile('reporte-cursables', mockFile);

      expect(result.success).toBe(true);
      expect(result.data.summary.stagingCleared).toBe(true);
    });

    it('should verify system stats reflect only latest upload data', async () => {
      const mockStatsResponse = {
        data: {
          staging_adol_simple: 50, // Solo los datos del último archivo cargado
          staging_dol: 30,
          staging_vacantes_inicio: 25,
          academic_structures: 100,
          teachers: 75,
          course_reports: 40
        }
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockStatsResponse);

      const result = await uploadService.getSystemStats();

      expect(apiClient.get).toHaveBeenCalledWith('/uploads/admin/stats');
      expect(result.staging_adol_simple).toBe(50);
      expect(result.staging_dol).toBe(30);
      expect(result.staging_vacantes_inicio).toBe(25);
      expect(result.academic_structures).toBe(100);
      expect(result.teachers).toBe(75);
      expect(result.course_reports).toBe(40);
    });
  });
});
