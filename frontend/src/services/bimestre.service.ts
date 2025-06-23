import apiClient from './apiClient';

export interface Bimestre {
  id: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  anoAcademico: number;
  numeroBimestre: number;
  activo: boolean;
  descripcion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBimestreDto {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  anoAcademico: number;
  numeroBimestre: number;
  descripcion?: string;
}

export interface UpdateBimestreDto {
  nombre?: string;
  fechaInicio?: string;
  fechaFin?: string;
  activo?: boolean;
  descripcion?: string;
}

export class BimestreService {
  private baseUrl = '/bimestres';

  async findAll(anoAcademico?: number): Promise<Bimestre[]> {
    const url = anoAcademico 
      ? `${this.baseUrl}?anoAcademico=${anoAcademico}`
      : this.baseUrl;
    
    const response = await apiClient.get(url);
    return response.data.data;
  }
  async findActivos(): Promise<Bimestre[]> {
    const response = await apiClient.get(`${this.baseUrl}/activos`);
    return response.data.data;
  }

  async findBimestreActual(): Promise<Bimestre | null> {
    const response = await apiClient.get(`${this.baseUrl}/actual`);
    return response.data.data;
  }

  async findById(id: number): Promise<Bimestre> {
    const response = await apiClient.get(`${this.baseUrl}/${id}`);
    return response.data.data;
  }

  async create(createBimestreDto: CreateBimestreDto): Promise<Bimestre> {
    const response = await apiClient.post(this.baseUrl, createBimestreDto);
    return response.data.data;
  }

  async update(id: number, updateBimestreDto: UpdateBimestreDto): Promise<Bimestre> {
    const response = await apiClient.put(`${this.baseUrl}/${id}`, updateBimestreDto);
    return response.data.data;
  }

  async activar(id: number): Promise<Bimestre> {
    const response = await apiClient.put(`${this.baseUrl}/${id}/activar`);
    return response.data.data;
  }

  async desactivar(id: number): Promise<Bimestre> {
    const response = await apiClient.put(`${this.baseUrl}/${id}/desactivar`);
    return response.data.data;
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  async generarBimestresAno(anoAcademico: number, fechaInicioAno: string): Promise<Bimestre[]> {
    const response = await apiClient.post(
      `${this.baseUrl}/generar-ano/${anoAcademico}`,
      { fechaInicioAno }
    );
    return response.data.data;
  }

  // Métodos helpers para el frontend
  formatFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getDuracionDias(fechaInicio: string, fechaFin: string): number {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  contieneFecha(bimestre: Bimestre, fecha: Date): boolean {
    const fechaInicio = new Date(bimestre.fechaInicio);
    const fechaFin = new Date(bimestre.fechaFin);
    return fecha >= fechaInicio && fecha <= fechaFin;
  }

  getFechasRango(fechaInicio: string, fechaFin: string): Date[] {
    const fechas: Date[] = [];
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    const currentDate = new Date(inicio);
    while (currentDate <= fin) {
      fechas.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return fechas;
  }
}

export const bimestreService = new BimestreService();
