import apiClient from './apiClient';

export interface Carrera {
  id: number;
  codigo_plan: string;
  nombre_carrera: string;
  fecha_creacion: string;
  activo: boolean;
}

class CarrerasService {
  async getCarreras(): Promise<Carrera[]> {
    const response = await apiClient.get('/carreras');
    return response.data;
  }
}

export const carrerasService = new CarrerasService();