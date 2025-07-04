export interface ApprovalRequest {
  id: string;
  type: 'schedule_change' | 'resource_allocation' | 'course_creation' | 'instructor_assignment';
  title: string;
  description: string;
  requestedBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'in_review';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  approvedBy?: {
    id: string;
    name: string;
    email: string;
  };
  approvedAt?: string;
  rejectionReason?: string;
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
  metadata?: {
    courseId?: string;
    resourceId?: string;
    scheduleId?: string;
    instructorId?: string;
    [key: string]: any;
  };
}

export interface ApprovalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  inReview: number;
  overdue: number;
}

export interface ApprovalFilters {
  status?: string;
  type?: string;
  priority?: string;
  requestedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ApprovalAction {
  action: 'approve' | 'reject' | 'request_changes';
  comments?: string;
  conditions?: string[];
}

class ApprovalService {
  private baseUrl = '/api/approvals';

  async getApprovalRequests(filters?: ApprovalFilters): Promise<ApprovalRequest[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });
      }
      
      const response = await fetch(`${this.baseUrl}?${queryParams}`);
      if (!response.ok) throw new Error('Error al cargar solicitudes');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching approval requests:', error);
      return this.getMockApprovalRequests(filters);
    }
  }

  async getApprovalStats(): Promise<ApprovalStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`);
      if (!response.ok) throw new Error('Error al cargar estadísticas');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching approval stats:', error);
      return this.getMockApprovalStats();
    }
  }

  async getApprovalRequest(id: string): Promise<ApprovalRequest> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      if (!response.ok) throw new Error('Error al cargar solicitud');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching approval request:', error);
      const mockRequests = this.getMockApprovalRequests();
      const request = mockRequests.find(r => r.id === id);
      if (!request) throw new Error('Solicitud no encontrada');
      return request;
    }
  }

  async processApproval(id: string, action: ApprovalAction): Promise<ApprovalRequest> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action),
      });
      
      if (!response.ok) throw new Error('Error al procesar solicitud');
      
      return await response.json();
    } catch (error) {
      console.error('Error processing approval:', error);
      // Simular procesamiento exitoso
      const request = await this.getApprovalRequest(id);
      return {
        ...request,
        status: action.action === 'approve' ? 'approved' : 'rejected',
        updatedAt: new Date().toISOString(),
        approvedAt: action.action === 'approve' ? new Date().toISOString() : undefined,
        rejectionReason: action.action === 'reject' ? action.comments : undefined,
      };
    }
  }

  async bulkProcess(ids: string[], action: ApprovalAction): Promise<ApprovalRequest[]> {
    try {
      const response = await fetch(`${this.baseUrl}/bulk-process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids, action }),
      });
      
      if (!response.ok) throw new Error('Error al procesar solicitudes');
      
      return await response.json();
    } catch (error) {
      console.error('Error bulk processing approvals:', error);
      // Simular procesamiento en lote
      const results = [];
      for (const id of ids) {
        const processed = await this.processApproval(id, action);
        results.push(processed);
      }
      return results;
    }
  }

  private getMockApprovalRequests(filters?: ApprovalFilters): ApprovalRequest[] {
    const mockData: ApprovalRequest[] = [
      {
        id: '1',
        type: 'schedule_change',
        title: 'Cambio de Horario - Matemáticas I',
        description: 'Solicitud para cambiar el horario del curso de Matemáticas I de lunes 8:00 AM a martes 10:00 AM',
        requestedBy: {
          id: 'prof1',
          name: 'Dr. Carlos García',
          email: 'carlos.garcia@universidad.edu',
          role: 'Profesor'
        },
        status: 'pending',
        priority: 'medium',
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T08:00:00Z',
        dueDate: '2024-01-20T23:59:59Z',
        metadata: {
          courseId: 'MAT101',
          scheduleId: 'SCH001'
        }
      },
      {
        id: '2',
        type: 'resource_allocation',
        title: 'Asignación de Laboratorio de Física',
        description: 'Solicitud para reservar el laboratorio de física para prácticas experimentales',
        requestedBy: {
          id: 'prof2',
          name: 'Dra. Ana López',
          email: 'ana.lopez@universidad.edu',
          role: 'Profesora'
        },
        status: 'approved',
        priority: 'high',
        createdAt: '2024-01-14T10:30:00Z',
        updatedAt: '2024-01-15T14:20:00Z',
        approvedBy: {
          id: 'admin1',
          name: 'Director Académico',
          email: 'director@universidad.edu'
        },
        approvedAt: '2024-01-15T14:20:00Z',
        metadata: {
          resourceId: 'LAB_FIS_01'
        }
      },
      {
        id: '3',
        type: 'course_creation',
        title: 'Nuevo Curso: Inteligencia Artificial',
        description: 'Propuesta para crear un nuevo curso de Inteligencia Artificial en el programa de Ingeniería',
        requestedBy: {
          id: 'prof3',
          name: 'Dr. Miguel Rodríguez',
          email: 'miguel.rodriguez@universidad.edu',
          role: 'Profesor'
        },
        status: 'in_review',
        priority: 'low',
        createdAt: '2024-01-12T16:45:00Z',
        updatedAt: '2024-01-14T09:15:00Z',
        dueDate: '2024-01-25T23:59:59Z'
      },
      {
        id: '4',
        type: 'instructor_assignment',
        title: 'Asignación de Instructor - Química Orgánica',
        description: 'Solicitud para asignar instructor suplente para el curso de Química Orgánica',
        requestedBy: {
          id: 'coord1',
          name: 'Coordinador de Química',
          email: 'coord.quimica@universidad.edu',
          role: 'Coordinador'
        },
        status: 'rejected',
        priority: 'urgent',
        createdAt: '2024-01-10T11:20:00Z',
        updatedAt: '2024-01-13T15:30:00Z',
        rejectionReason: 'No hay instructores disponibles con la especialización requerida',
        metadata: {
          courseId: 'QUI201',
          instructorId: 'INST_TEMP_01'
        }
      }
    ];

    if (!filters) return mockData;

    return mockData.filter(request => {
      if (filters.status && request.status !== filters.status) return false;
      if (filters.type && request.type !== filters.type) return false;
      if (filters.priority && request.priority !== filters.priority) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          request.title.toLowerCase().includes(searchLower) ||
          request.description.toLowerCase().includes(searchLower) ||
          request.requestedBy.name.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }

  private getMockApprovalStats(): ApprovalStats {
    return {
      total: 4,
      pending: 1,
      approved: 1,
      rejected: 1,
      inReview: 1,
      overdue: 0
    };
  }
}

export const approvalService = new ApprovalService();