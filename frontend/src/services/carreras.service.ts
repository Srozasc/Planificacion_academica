import apiClient from './apiClient';

export interface Carrera {
  id: number;
  codigo_plan: string;
  nombre_carrera: string;
  fecha_creacion: string;
  activo: boolean;
}

class CarrerasService {
  async getCarreras(bimestreId?: number): Promise<Carrera[]> {
    const params = bimestreId ? { bimestreId: bimestreId.toString() } : {};
    const response = await apiClient.get('/carreras', { params });
    return response.data;
  }
}

export const carrerasService = new CarrerasService();