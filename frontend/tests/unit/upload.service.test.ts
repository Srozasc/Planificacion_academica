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

  describe('Upload Details', () => {
    it('should get upload details successfully', async () => {
      const mockUploadId = '123';
      const mockDetailsResponse = {
        data: {
          success: true,
          data: {
            filename: 'test-file.xlsx',
            type: 'adol',
            date: '2024-01-15',
            bimestre: '2024-1',
            validRecords: [
              {
                rowNumber: 1,
                data: { nombre: 'Juan Pérez', cedula: '12345678' },
                errors: []
              }
            ],
            invalidRecords: [
              {
                rowNumber: 2,
                data: { nombre: '', cedula: 'invalid' },
                errors: ['Nombre es requerido', 'Cédula inválida']
              }
            ]
          }
        }
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockDetailsResponse);

      const result = await uploadService.getUploadDetails(mockUploadId);

      expect(apiClient.get).toHaveBeenCalledWith(`/uploads/details/${mockUploadId}`);
      expect(result.filename).toBe('test-file.xlsx');
      expect(result.type).toBe('adol');
      expect(result.validRecords).toHaveLength(1);
      expect(result.invalidRecords).toHaveLength(1);
   });

    it('should handle error when getting upload details', async () => {
      const mockUploadId = '123';
      const mockError = {
        response: {
          data: {
            message: 'Upload not found'
          }
        }
      };

      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(uploadService.getUploadDetails(mockUploadId))
        .rejects.toThrow('Upload not found');
    });
  });

  describe('Recent Uploads', () => {
    it('should get recent uploads successfully', async () => {
      const mockRecentUploads = [
        {
          id: 1,
          file_name: 'adol_data.xlsx',
          upload_type: 'adol',
          upload_date: '2024-01-15T10:30:00Z',
          bimestre: '2024-1',
          status: 'Exitoso',
          approval_status: 'Pendiente',
          is_processed: false,
          total_records: 100,
          error_count: 0,
          user_name: 'admin'
        },
        {
          id: 2,
          file_name: 'dol_data.xlsx',
          upload_type: 'dol',
          upload_date: '2024-01-14T15:45:00Z',
          bimestre: '2024-1',
          status: 'Con errores',
          approval_status: 'Aprobado',
          is_processed: true,
          total_records: 50,
          error_count: 5,
          user_name: 'user1'
        }
      ];

      const mockResponse = {
        data: {
          data: mockRecentUploads
        }
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadService.getRecentUploads();

      expect(apiClient.get).toHaveBeenCalledWith('/uploads/recent');
      expect(result).toHaveLength(2);
      expect(result[0].file_name).toBe('adol_data.xlsx');
      expect(result[1].status).toBe('Con errores');
    });

    it('should handle error when getting recent uploads', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Database connection failed'
          }
        }
      };

      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(uploadService.getRecentUploads())
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('Upload History', () => {
    it('should get upload history with pagination', async () => {
      const mockHistoryResponse = {
        data: {
          data: {
            uploads: [
              {
                id: 1,
                file_name: 'test1.xlsx',
                upload_type: 'adol',
                upload_date: '2024-01-15T10:30:00Z',
                bimestre: '2024-1',
                status: 'Exitoso',
                approval_status: 'Aprobado',
                is_processed: true,
                total_records: 100,
                error_count: 0
              }
            ],
            total: 1,
            page: 1,
            limit: 20
          }
        }
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockHistoryResponse);

      const result = await uploadService.getUploadHistory(1, 20);

      expect(apiClient.get).toHaveBeenCalledWith('/uploads/history?page=1&limit=20');
      expect(result.uploads).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should get upload history with filters', async () => {
      const filters = {
        uploadType: 'adol',
        status: 'Exitoso',
        approvalStatus: 'Pendiente',
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31'
      };

      const mockHistoryResponse = {
        data: {
          data: {
            uploads: [],
            total: 0,
            page: 1,
            limit: 20
          }
        }
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockHistoryResponse);

      await uploadService.getUploadHistory(1, 20, filters);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/uploads/history?page=1&limit=20&uploadType=adol&status=Exitoso&approvalStatus=Pendiente&dateFrom=2024-01-01&dateTo=2024-01-31'
      );
    });

    it('should handle error when getting upload history', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Access denied'
          }
        }
      };

      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(uploadService.getUploadHistory())
        .rejects.toThrow('Access denied');
    });
  });

  describe('Upload Approval', () => {
    it('should approve upload successfully', async () => {
      const uploadId = 123;
      const comments = 'Datos verificados correctamente';
      const mockResponse = {
        data: {
          success: true,
          message: 'Upload aprobado exitosamente'
        }
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadService.approveUpload(uploadId, comments);

      expect(apiClient.post).toHaveBeenCalledWith(`/uploads/${uploadId}/approve`, {
        comments
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Upload aprobado exitosamente');
    });

    it('should approve upload without comments', async () => {
      const uploadId = 123;
      const mockResponse = {
        data: {
          success: true,
          message: 'Upload aprobado exitosamente'
        }
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadService.approveUpload(uploadId);

      expect(apiClient.post).toHaveBeenCalledWith(`/uploads/${uploadId}/approve`, {
        comments: undefined
      });
      expect(result.success).toBe(true);
    });

    it('should handle error when approving upload', async () => {
      const uploadId = 123;
      const mockError = {
        response: {
          data: {
            message: 'Upload already processed'
          }
        }
      };

      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      await expect(uploadService.approveUpload(uploadId))
        .rejects.toThrow('Upload already processed');
    });

    it('should reject upload successfully', async () => {
      const uploadId = 123;
      const comments = 'Datos incorrectos';
      const mockResponse = {
        data: {
          success: true,
          message: 'Upload rechazado exitosamente'
        }
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadService.rejectUpload(uploadId, comments);

      expect(apiClient.post).toHaveBeenCalledWith(`/uploads/${uploadId}/reject`, {
        comments
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Upload rechazado exitosamente');
    });

    it('should reject upload without comments', async () => {
      const uploadId = 123;
      const mockResponse = {
        data: {
          success: true,
          message: 'Upload rechazado exitosamente'
        }
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadService.rejectUpload(uploadId);

      expect(apiClient.post).toHaveBeenCalledWith(`/uploads/${uploadId}/reject`, {
        comments: undefined
      });
      expect(result.success).toBe(true);
    });

    it('should handle error when rejecting upload', async () => {
      const uploadId = 123;
      const mockError = {
        response: {
          data: {
            message: 'Insufficient permissions'
          }
        }
      };

      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      await expect(uploadService.rejectUpload(uploadId))
        .rejects.toThrow('Insufficient permissions');
    });
  });

  describe('Legacy Methods', () => {
    it('should upload academic structure using legacy method', async () => {
      const mockFile = new File(['dummy content'], 'estructura.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const options = { bimestreId: 1 };
      const mockResponse = {
        data: {
          success: true,
          message: 'Estructura académica procesada exitosamente',
          data: {
            summary: {
              totalRecords: 50,
              validRecords: 50,
              invalidRecords: 0,
              errors: []
            }
          }
        }
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadService.uploadAcademicStructure(mockFile, options);

      expect(result.success).toBe(true);
      expect(result.summary.totalRecords).toBe(50);
    });

    it('should upload reporte cursables using legacy method', async () => {
      const mockFile = new File(['dummy content'], 'cursables.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const mockResponse = {
        data: {
          success: true,
          message: 'Reporte cursables procesado exitosamente',
          data: {
            summary: {
              totalRecords: 30,
              validRecords: 30,
              invalidRecords: 0,
              errors: []
            }
          }
        }
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadService.uploadReporteCursables(mockFile);

      expect(result.success).toBe(true);
      expect(result.summary.totalRecords).toBe(30);
    });

    it('should upload teachers using legacy method', async () => {
      const mockFile = new File(['dummy content'], 'docentes.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const options = { bimestreId: 1 };
      const mockResponse = {
        data: {
          success: true,
          message: 'Nómina de docentes procesada exitosamente',
          data: {
            summary: {
              totalRecords: 75,
              validRecords: 75,
              invalidRecords: 0,
              errors: []
            }
          }
        }
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadService.uploadTeachers(mockFile, options);

      expect(result.success).toBe(true);
      expect(result.summary.totalRecords).toBe(75);
    });

    it('should upload nomina docentes using legacy method', async () => {
      const mockFile = new File(['dummy content'], 'nomina.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const options = { bimestreId: 1 };
      const mockResponse = {
        data: {
          success: true,
          message: 'Nómina de docentes procesada exitosamente',
          data: {
            summary: {
              totalRecords: 80,
              validRecords: 80,
              invalidRecords: 0,
              errors: []
            }
          }
        }
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadService.uploadNominaDocentes(mockFile, options);

      expect(result.success).toBe(true);
      expect(result.summary.totalRecords).toBe(80);
    });

    it('should upload DOL using legacy method', async () => {
      const mockFile = new File(['dummy content'], 'dol.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const mockResponse = {
        data: {
          success: true,
          message: 'DOL procesado exitosamente',
          data: {
            summary: {
              totalRecords: 25,
              validRecords: 25,
              invalidRecords: 0,
              errors: []
            }
          }
        }
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadService.uploadDol(mockFile);

      expect(result.success).toBe(true);
      expect(result.summary.totalRecords).toBe(25);
    });

    it('should upload vacantes inicio using legacy method', async () => {
      const mockFile = new File(['dummy content'], 'vacantes.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const mockResponse = {
        data: {
          success: true,
          message: 'Vacantes inicio procesadas exitosamente',
          data: {
            summary: {
              totalRecords: 40,
              validRecords: 40,
              invalidRecords: 0,
              errors: []
            }
          }
        }
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadService.uploadVacantesInicio(mockFile);

      expect(result.success).toBe(true);
      expect(result.summary.totalRecords).toBe(40);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle network timeout errors', async () => {
      const mockFile = new File(['dummy content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const timeoutError = new Error('timeout of 300000ms exceeded');
      timeoutError.name = 'TimeoutError';

      (apiClient.post as jest.Mock).mockRejectedValue(timeoutError);

      await expect(uploadService.uploadFile('adol', mockFile))
        .rejects.toThrow('Error al cargar el archivo');
    });

    it('should handle large file uploads with proper timeout', async () => {
      const mockFile = new File(['x'.repeat(10000000)], 'large-file.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const mockResponse = {
        data: {
          success: true,
          message: 'Archivo grande procesado exitosamente',
          data: {
            summary: {
              totalRecords: 10000,
              validRecords: 9500,
              invalidRecords: 500,
              errors: []
            }
          }
        }
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadService.uploadFile('adol', mockFile);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/uploads/adol',
        expect.any(FormData),
        expect.objectContaining({
          timeout: 300000
        })
      );
      expect(result.success).toBe(true);
    });

    it('should handle validation with large files and proper timeout', async () => {
      const mockFile = new File(['x'.repeat(5000000)], 'validation-file.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const mockResponse = {
        data: {
          isValid: false,
          summary: {
            totalRecords: 5000,
            validRecords: 4000,
            invalidRecords: 1000,
            errors: ['Error en fila 100', 'Error en fila 200']
          }
        }
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadService.validateFile('dol', mockFile);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/uploads/validate/dol',
        expect.any(FormData),
        expect.objectContaining({
          timeout: 300000
        })
      );
      expect(result.isValid).toBe(false);
      expect(result.summary.invalidRecords).toBe(1000);
    });

    it('should handle empty response data gracefully', async () => {
      const mockResponse = {
        data: {}
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadService.getSystemStats();

      expect(result).toEqual({});
    });

    it('should handle malformed API responses', async () => {
      const mockFile = new File(['dummy content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const mockResponse = {
        data: {
          success: true,
          message: null,
          data: null
        }
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadService.uploadFile('adol', mockFile);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Archivo procesado exitosamente');
      expect(result.summary.totalRecords).toBe(0);
    });

    it('should handle completely null API responses', async () => {
      const mockFile = new File(['dummy content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const mockError = new Error('Network error');

      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      await expect(uploadService.uploadFile('adol', mockFile))
        .rejects.toThrow('Error al cargar el archivo');
    });
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
