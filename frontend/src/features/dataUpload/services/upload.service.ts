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
  temp: { files: number; size: number };
  processed: { files: number; size: number };
  failed: { files: number; size: number };
  academic: { files: number; size: number };
  teachers: { files: number; size: number };
  paymentCodes: { files: number; size: number };
  courseReports: { files: number; size: number };
  total: { files: number; size: number };
}

export interface TemplateInfo {
  availableTemplates: string[];
  templates: {
    [key: string]: {
      filename: string;
      description: string;
      columns: string[];
    };
  };
}

// Upload service for API calls
export const uploadService = {
  // Generic upload method
  async uploadFile(endpoint: string, file: File, options: { mode?: string; validateOnly?: boolean } = {}): Promise<UploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', options.mode || 'UPSERT');
      formData.append('validateOnly', options.validateOnly ? 'true' : 'false');

      const response = await apiClient.post(`/uploads/${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });      return {
        success: true,
        message: response.data.message || 'Archivo procesado exitosamente',
        summary: {
          totalRecords: response.data.totalRecords || 0,
          validRecords: response.data.processedRecords || 0,
          invalidRecords: response.data.errorCount || 0,
          errors: response.data.errors || []
        },
        data: response.data
      };
    } catch (error: any) {
      console.error('Upload error:', error);
      throw new Error(error.response?.data?.message || 'Error al cargar el archivo');
    }
  },

  // Validation only method
  async validateFile(endpoint: string, file: File): Promise<ValidationResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post(`/uploads/validate/${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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
  // Get available templates
  async getTemplates(): Promise<TemplateInfo> {
    try {
      const response = await apiClient.get('/templates');
      return response.data;
    } catch (error: any) {
      console.error('Templates error:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener plantillas');
    }
  },
  // Download template
  async downloadTemplate(templateType: string): Promise<void> {
    try {
      const response = await apiClient.get(`/templates/${templateType}`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `template_${templateType}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Template download error:', error);
      throw new Error(error.response?.data?.message || 'Error al descargar la plantilla');
    }
  },

  // Cleanup files
  async cleanupFiles(type?: string): Promise<any> {
    try {
      const endpoint = type ? `/uploads/admin/cleanup/${type}` : '/uploads/admin/cleanup';
      const response = await apiClient.delete(endpoint);
      return response.data;
    } catch (error: any) {
      console.error('Cleanup error:', error);
      throw new Error(error.response?.data?.message || 'Error al limpiar archivos');
    }
  },

  // Legacy methods for backward compatibility
  async uploadAcademicStructure(file: File): Promise<UploadResult> {
    return this.uploadFile('academic-structures', file);
  },

  async uploadCourseReports(file: File): Promise<UploadResult> {
    return this.uploadFile('course-reports', file);
  },

  async uploadTeachers(file: File): Promise<UploadResult> {
    return this.uploadFile('teachers', file);
  },

  async uploadPaymentCodes(file: File): Promise<UploadResult> {
    return this.uploadFile('payment-codes', file);
  }
};
