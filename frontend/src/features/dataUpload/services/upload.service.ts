import apiClient from '../../../services/apiClient';

// Types
export interface UploadError {
  row: number;
  data: any;
  type: string;
  field: string;
  message: string;
}

export interface UploadResult {
  success: boolean;
  message: string;
  summary: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    errors?: (string | UploadError)[];
  };
  data?: any;
}

export interface ValidationResult {
  isValid: boolean;
  summary: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    errors?: (string | UploadError)[];
  };
}

export interface SystemStats {
  staging_adol_simple: number;
  staging_dol: number;
  staging_vacantes_inicio: number;
  academic_structures: number;
  teachers: number;
  course_reports: number;
}



// Upload service for API calls
export const uploadService = {
  // Generic upload method
  async uploadFile(endpoint: string, file: File, options: { mode?: string; validateOnly?: boolean; bimestreId?: number } = {}): Promise<UploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', options.mode || 'UPSERT');
      formData.append('validateOnly', options.validateOnly ? 'true' : 'false');
      
      if (options.bimestreId) {
        formData.append('bimestreId', options.bimestreId.toString());
      }

      const response = await apiClient.post(`/uploads/${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutos para cargas de archivos grandes
      });      return {
        success: response.data.success || true,
        message: response.data.message || 'Archivo procesado exitosamente',
        summary: {
          totalRecords: response.data.data?.summary?.totalRecords || 0,
          validRecords: response.data.data?.summary?.validRecords || 0,
          invalidRecords: response.data.data?.summary?.invalidRecords || 0,
          errors: response.data.data?.summary?.errors || []
        },
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Upload error:', error);
      throw new Error(error.response?.data?.message || 'Error al cargar el archivo');
    }
  },

  // Validation only method
  async validateFile(endpoint: string, file: File, options: { bimestreId?: number } = {}): Promise<ValidationResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options.bimestreId) {
        formData.append('bimestreId', options.bimestreId.toString());
      }

      const response = await apiClient.post(`/uploads/validate/${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutos para validaciones de archivos grandes
      });

      return {
        isValid: response.data.isValid || false,
        summary: {
          totalRecords: response.data.summary?.totalRecords || 0,
          validRecords: response.data.summary?.validRecords || 0,
          invalidRecords: response.data.summary?.invalidRecords || 0,
          errors: response.data.summary?.errors || []
        }
      };
    } catch (error: any) {
      console.error('Validation error:', error);
      throw new Error(error.response?.data?.message || 'Error al validar el archivo');
    }
  },

  // Get system statistics
  async getSystemStats(): Promise<SystemStats> {
    try {
      const response = await apiClient.get('/uploads/admin/stats');
      return response.data;
    } catch (error: any) {
      console.error('Stats error:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener estadísticas');
    }
  },

  // Get system health
  async getSystemHealth(): Promise<any> {
    try {
      const response = await apiClient.get('/uploads/admin/health');
      return response.data;
    } catch (error: any) {
      console.error('Health error:', error);
      throw new Error(error.response?.data?.message || 'Error al verificar el estado del sistema');
    }
  },

  // Legacy methods for backward compatibility
  async uploadAcademicStructure(file: File, options: { bimestreId: number }): Promise<UploadResult> {
    return this.uploadFile('estructura-academica', file, options);
  },

  async uploadReporteCursables(file: File): Promise<UploadResult> {
    return this.uploadFile('reporte-cursables', file);
  },

  async uploadTeachers(file: File, options: { bimestreId: number }): Promise<UploadResult> {
    return this.uploadFile('nomina-docentes', file, options);
  },

  async uploadNominaDocentes(file: File, options: { bimestreId: number }): Promise<UploadResult> {
    return this.uploadFile('nomina-docentes', file, options);
  },

  async uploadDol(file: File): Promise<UploadResult> {
    return this.uploadFile('dol', file);
  },

  async uploadVacantesInicio(file: File): Promise<UploadResult> {
    return this.uploadFile('vacantes-inicio', file);
  }
};