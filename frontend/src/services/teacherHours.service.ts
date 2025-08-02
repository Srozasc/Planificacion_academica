import apiClient from './apiClient';

export interface TeacherHoursResponse {
  teacherId: number;
  bimestreId: number;
  totalHoras: number;
}

export interface MultipleTeacherHoursResponse {
  bimestreId: number;
  teachersHours: Record<number, number>;
}

class TeacherHoursService {
  private baseUrl = '/teachers';

  /**
   * Obtiene las horas asignadas para un docente específico en un bimestre
   * @param teacherId ID del docente
   * @param bimestreId ID del bimestre
   * @returns Información de horas asignadas
   */
  async getTeacherAssignedHours(teacherId: number, bimestreId: number): Promise<TeacherHoursResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/assigned-hours`, {
        params: {
          teacherId,
          bimestreId
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching teacher assigned hours:', error);
      throw new Error(this.extractErrorMessage(error));
    }
  }

  /**
   * Obtiene las horas asignadas para múltiples docentes en un bimestre
   * @param teacherIds Array de IDs de docentes
   * @param bimestreId ID del bimestre
   * @returns Objeto con las horas de cada docente
   */
  async getMultipleTeachersAssignedHours(teacherIds: number[], bimestreId: number): Promise<MultipleTeacherHoursResponse> {
    try {
      if (teacherIds.length === 0) {
        return {
          bimestreId,
          teachersHours: {}
        };
      }

      const response = await apiClient.get(`${this.baseUrl}/multiple-assigned-hours`, {
        params: {
          teacherIds: teacherIds.join(','),
          bimestreId
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching multiple teachers assigned hours:', error);
      throw new Error(this.extractErrorMessage(error));
    }
  }

  /**
   * Extrae el mensaje de error de la respuesta del servidor
   * @param error Error de la petición
   * @returns Mensaje de error legible
   */
  private extractErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Error al obtener las horas asignadas del docente';
  }
}

export const teacherHoursService = new TeacherHoursService();
export default TeacherHoursService;