import apiClient from './apiClient';

export interface Asignatura {
  id: number;
  carrera_id: number;
  sigla: string;
  nombre: string;
  creditos: number;
  categoria_asignatura: string;
  fecha_creacion: string;
  activo: boolean;
}

class AsignaturasService {
  async getAsignaturas(): Promise<Asignatura[]> {
    const response = await apiClient.get('/asignaturas');
    return response.data;
  }

  async getCategorias(): Promise<string[]> {
    const response = await apiClient.get('/asignaturas/categorias');
    return response.data;
  }

  async getAdolAprobados(bimestreId?: number): Promise<{ sigla: string; descripcion: string }[]> {
    const params = bimestreId ? { bimestreId: bimestreId.toString() } : {};
    const response = await apiClient.get('/asignaturas/adol-aprobados', { params });
    return response.data;
  }
}

export const asignaturasService = new AsignaturasService();