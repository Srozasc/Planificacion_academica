import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface Course {
  id: string;
  code: string;
  name: string;
  section: string;
  teacher: string;
  schedule: {
    day: string;
    startTime: string;
    endTime: string;
  };
  room: string;
  capacity: number;
  enrolled: number;
  occupancy: number;
  status: 'active' | 'pending' | 'cancelled';
}

export interface ScheduleStats {
  totalEvents: number;
  activeTeachers: number;
  usedRooms: number;
}

export interface ScheduleFilters {
  year?: string;
  period?: string;
  search?: string;
  teacher?: string;
  room?: string;
}

class ScheduleService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }

  async getCourses(filters?: ScheduleFilters): Promise<Course[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.year) params.append('year', filters.year);
      if (filters?.period) params.append('period', filters.period);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.teacher) params.append('teacher', filters.teacher);
      if (filters?.room) params.append('room', filters.room);

      const response = await axios.get(
        `${API_BASE_URL}/schedules?${params.toString()}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      // Retornar datos mock en caso de error
      return this.getMockCourses();
    }
  }

  async getStats(): Promise<ScheduleStats> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/scheduling/stats`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Retornar datos mock en caso de error
      return {
        totalEvents: 156,
        activeTeachers: 23,
        usedRooms: 18
      };
    }
  }

  async createCourse(course: Omit<Course, 'id'>): Promise<Course> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/schedules`,
        course,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  async updateCourse(id: string, course: Partial<Course>): Promise<Course> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/schedules/${id}`,
        course,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }

  async deleteCourse(id: string): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/schedules/${id}`,
        this.getAuthHeaders()
      );
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }

  private getMockCourses(): Course[] {
    return [
      {
        id: '1',
        code: 'MAT-101',
        name: 'Matemáticas I',
        section: 'A',
        teacher: 'Dr. García',
        schedule: {
          day: 'Lunes',
          startTime: '08:00',
          endTime: '10:00'
        },
        room: 'Aula 101',
        capacity: 40,
        enrolled: 36,
        occupancy: 90,
        status: 'active'
      },
      {
        id: '2',
        code: 'FIS-201',
        name: 'Física II',
        section: 'B',
        teacher: 'Dra. López',
        schedule: {
          day: 'Martes',
          startTime: '10:00',
          endTime: '12:00'
        },
        room: 'Lab. Física 1',
        capacity: 30,
        enrolled: 22,
        occupancy: 73,
        status: 'active'
      },
      {
        id: '3',
        code: 'PROG-301',
        name: 'Programación Avanzada',
        section: 'A',
        teacher: 'Dr. Martínez',
        schedule: {
          day: 'Miércoles',
          startTime: '14:00',
          endTime: '16:00'
        },
        room: 'Lab. Sistemas 2',
        capacity: 25,
        enrolled: 23,
        occupancy: 92,
        status: 'active'
      },
      {
        id: '4',
        code: 'QUI-101',
        name: 'Química General',
        section: 'C',
        teacher: 'Dra. Rodríguez',
        schedule: {
          day: 'Jueves',
          startTime: '16:00',
          endTime: '18:00'
        },
        room: 'Lab. Química 1',
        capacity: 20,
        enrolled: 18,
        occupancy: 90,
        status: 'active'
      }
    ];
  }
}

export const scheduleService = new ScheduleService();