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

  it('should cleanup files successfully', async () => {
    const mockResponse = { data: { message: 'Limpieza de archivos completada exitosamente' } };
    (apiClient.delete as jest.Mock).mockResolvedValue(mockResponse);

    const result = await uploadService.cleanupFiles('temp');

    expect(apiClient.delete).toHaveBeenCalledWith('/uploads/admin/cleanup/temp');
    expect(result).toEqual(mockResponse.data);
  });

  it('should cleanup all files successfully if no type is provided', async () => {
    const mockResponse = { data: { success: true, message: 'Limpieza de archivos completada exitosamente' } };
    (apiClient.delete as jest.Mock).mockResolvedValue(mockResponse);

    const result = await uploadService.cleanupFiles();

    expect(apiClient.delete).toHaveBeenCalledWith('/uploads/admin/cleanup');
    expect(result).toEqual(mockResponse.data);
  });
});
