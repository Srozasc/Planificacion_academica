import apiClient from './apiClient';

export interface VacantesRequeridas {
  sigla: string;
  asignatura: string;
  total_vacantes: number;
  plan?: string;
  nivel?: string;
}

export interface EstadisticasVacantes {
  total_vacantes: number;
  asignaturas_unicas: number;
  bimestre_id: number;
}

class ReporteCursablesService {
  /**
   * Obtiene el total de vacantes requeridas para una sigla específica
   * @param sigla - Sigla de la asignatura
   * @param bimestreId - ID del bimestre (opcional)
   * @param plan - Código del plan (opcional, para filtrar asignaturas que existen en múltiples planes)
   * @returns Promise con la información de vacantes requeridas
   */
  async getVacantesRequeridas(sigla: string, bimestreId?: number, plan?: string): Promise<VacantesRequeridas | null> {
    try {
      const params = new URLSearchParams();
      if (bimestreId) {
        params.append('bimestreId', bimestreId.toString());
      }
      if (plan) {
        params.append('plan', plan);
      }
      
      const url = `/reporte-cursables/vacantes/${encodeURIComponent(sigla)}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo vacantes requeridas:', error);
      return null;
    }
  }

  /**
   * Obtiene todas las asignaturas con sus vacantes requeridas
   */
  async getAllVacantesRequeridas(bimestreId?: number): Promise<VacantesRequeridas[]> {
    try {
      const params = new URLSearchParams();
      if (bimestreId) {
        params.append('bimestreId', bimestreId.toString());
      }
      
      const url = `/reporte-cursables/vacantes${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo todas las vacantes requeridas:', error);
      return [];
    }
  }

  /**
   * Obtiene estadísticas generales de vacantes por bimestre
   */
  async getEstadisticasVacantes(bimestreId: number): Promise<EstadisticasVacantes | null> {
    try {
      const response = await apiClient.get(`/reporte-cursables/estadisticas/${bimestreId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas de vacantes:', error);
      return null;
    }
  }
}

export const reporteCursablesService = new ReporteCursablesService();