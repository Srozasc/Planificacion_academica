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

// Types for data visualization
export interface DataRecord {
  rowNumber: number;
  data: Record<string, any>;
  errors?: string[];
}

export interface UploadDetails {
  filename: string;
  type: string;
  date: string;
  bimestre: string;
  validRecords: DataRecord[];
  invalidRecords: DataRecord[];
}

// Types for upload management
export interface RecentUpload {
  id: number;
  file_name: string;
  upload_type: string;
  upload_date: string;
  bimestre: string;
  status: 'Exitoso' | 'Con errores' | 'Error';
  approval_status: 'Pendiente' | 'Aprobado' | 'Rechazado';
  is_processed: boolean;
  total_records: number;
  error_count: number;
  user_name?: string;
  approved_by_name?: string;
  approved_at?: string;
}

export interface UploadHistoryItem {
  id: number;
  file_name: string;
  upload_type: string;
  upload_date: string;
  bimestre: string;
  status: 'Exitoso' | 'Con errores' | 'Error';
  approval_status: 'Pendiente' | 'Aprobado' | 'Rechazado';
  is_processed: boolean;
  total_records: number;
  error_count: number;
  user_name?: string;
  approved_by_name?: string;
  approved_at?: string;
  error_details?: string;
}

export interface ApprovalAction {
  uploadId: number;
  action: 'approve' | 'reject';
  comments?: string;
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

  // Get upload details for visualization
  async getUploadDetails(uploadId: string): Promise<UploadDetails> {
    try {
      const response = await apiClient.get(`/uploads/details/${uploadId}`);
      
      // El backend envuelve la respuesta en {success, data, message, timestamp}
      // Los datos reales están en response.data.data
      const result = response.data.data;
      
      return result;
    } catch (error: any) {
      console.error('Upload details error:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener detalles de la carga');
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
  },

  // Upload management methods
  async getRecentUploads(bimestreId?: number): Promise<RecentUpload[]> {
    try {
      const url = bimestreId ? `/uploads/recent?bimestreId=${bimestreId}` : '/uploads/recent';
      const response = await apiClient.get(url);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Recent uploads error:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener cargas recientes');
    }
  },

  async getUploadHistory(page: number = 1, limit: number = 20, filters?: {
    uploadType?: string;
    status?: string;
    approvalStatus?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ uploads: UploadHistoryItem[]; total: number; page: number; limit: number }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      
      const response = await apiClient.get(`/uploads/history?${params}`);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Upload history error:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener historial de cargas');
    }
  },

  async approveUpload(uploadId: number, comments?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post(`/uploads/approve/${uploadId}`, {
        comments
      });
      return {
        success: response.data.success,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Approve upload error:', error);
      throw new Error(error.response?.data?.message || 'Error al aprobar la carga');
    }
  },

  async rejectUpload(uploadId: number, comments?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post(`/uploads/reject/${uploadId}`, {
        comments
      });
      return {
        success: response.data.success,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Reject upload error:', error);
      throw new Error(error.response?.data?.message || 'Error al rechazar la carga');
    }
  }
};