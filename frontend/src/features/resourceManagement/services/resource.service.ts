// Interfaces para la gestión de recursos
export interface Resource {
  id: string;
  name: string;
  type: 'aula' | 'laboratorio' | 'equipo' | 'software';
  location: string;
  capacity?: number;
  status: 'disponible' | 'ocupado' | 'mantenimiento' | 'reservado';
  description?: string;
  equipment?: string[];
  schedule?: ResourceSchedule[];
  createdAt: string;
  updatedAt: string;
}

export interface ResourceSchedule {
  id: string;
  resourceId: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  userId: string;
  userName: string;
  status: 'confirmado' | 'pendiente' | 'cancelado';
}

export interface ResourceStats {
  totalResources: number;
  availableResources: number;
  inUseResources: number;
  maintenanceResources: number;
  utilizationRate: number;
}

export interface ResourceFilters {
  type?: string;
  status?: string;
  location?: string;
  capacity?: number;
  searchTerm?: string;
}

export interface CreateResourceData {
  name: string;
  type: 'aula' | 'laboratorio' | 'equipo' | 'software';
  location: string;
  capacity?: number;
  description?: string;
  equipment?: string[];
}

export interface UpdateResourceData extends Partial<CreateResourceData> {
  status?: 'disponible' | 'ocupado' | 'mantenimiento' | 'reservado';
}

export interface CreateReservationData {
  resourceId: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  description?: string;
}

class ResourceService {
  private baseUrl = '/api/resources';

  // Obtener todos los recursos
  async getResources(filters?: ResourceFilters): Promise<Resource[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = queryParams.toString() 
        ? `${this.baseUrl}?${queryParams.toString()}`
        : this.baseUrl;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener recursos');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching resources:', error);
      // Retornar datos mock en caso de error
      return this.getMockResources(filters);
    }
  }

  // Obtener estadísticas de recursos
  async getResourceStats(): Promise<ResourceStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener estadísticas');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching resource stats:', error);
      // Retornar estadísticas mock
      return {
        totalResources: 15,
        availableResources: 12,
        inUseResources: 2,
        maintenanceResources: 1,
        utilizationRate: 75
      };
    }
  }

  // Crear nuevo recurso
  async createResource(resourceData: CreateResourceData): Promise<Resource> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resourceData),
      });

      if (!response.ok) {
        throw new Error('Error al crear recurso');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating resource:', error);
      throw error;
    }
  }

  // Actualizar recurso
  async updateResource(id: string, resourceData: UpdateResourceData): Promise<Resource> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resourceData),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar recurso');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating resource:', error);
      throw error;
    }
  }

  // Eliminar recurso
  async deleteResource(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar recurso');
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      throw error;
    }
  }

  // Crear reserva
  async createReservation(reservationData: CreateReservationData): Promise<ResourceSchedule> {
    try {
      const response = await fetch(`${this.baseUrl}/reservations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
      });

      if (!response.ok) {
        throw new Error('Error al crear reserva');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  }

  // Datos mock para desarrollo
  private getMockResources(filters?: ResourceFilters): Resource[] {
    const mockResources: Resource[] = [
      {
        id: '1',
        name: 'Aula 101',
        type: 'aula',
        location: 'Edificio A - Piso 1',
        capacity: 40,
        status: 'disponible',
        description: 'Aula estándar con proyector y audio',
        equipment: ['Proyector', 'Sistema de audio', 'Pizarra digital'],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        name: 'Lab. Sistemas 1',
        type: 'laboratorio',
        location: 'Edificio B - Piso 2',
        capacity: 25,
        status: 'ocupado',
        description: 'Laboratorio de sistemas con 25 computadores',
        equipment: ['25 Computadores', 'Proyector', 'Software especializado'],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '3',
        name: 'Proyector Portátil 001',
        type: 'equipo',
        location: 'Almacén - Audiovisuales',
        status: 'disponible',
        description: 'Proyector portátil para uso en diferentes aulas',
        equipment: ['Cables HDMI', 'Control remoto', 'Estuche de transporte'],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '4',
        name: 'Lab. Física 1',
        type: 'laboratorio',
        location: 'Edificio B - Piso 1',
        capacity: 20,
        status: 'mantenimiento',
        description: 'Laboratorio de física con equipos especializados',
        equipment: ['Equipos de medición', 'Balanzas de precisión', 'Microscopios'],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '5',
        name: 'MATLAB Campus License',
        type: 'software',
        location: 'Licencia Digital',
        status: 'disponible',
        description: 'Licencia campus de MATLAB para uso académico',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      }
    ];

    // Aplicar filtros si existen
    if (!filters) return mockResources;

    return mockResources.filter(resource => {
      if (filters.type && resource.type !== filters.type) return false;
      if (filters.status && resource.status !== filters.status) return false;
      if (filters.location && !resource.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.capacity && resource.capacity && resource.capacity < filters.capacity) return false;
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return resource.name.toLowerCase().includes(searchLower) ||
               resource.description?.toLowerCase().includes(searchLower) ||
               resource.location.toLowerCase().includes(searchLower);
      }
      return true;
    });
  }
}

export const resourceService = new ResourceService();