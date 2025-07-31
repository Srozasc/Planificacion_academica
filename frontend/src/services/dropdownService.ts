import apiClient from './apiClient';

export interface Teacher {
  id: number;
  name: string;
  rut: string;
  email: string;
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  category: string;
  acronym: string;
  course: string;
  plan_code?: string;
  level?: string;
}

export interface Room {
  value: string;
  label: string;
}

export interface Plan {
  value: string;
  label: string;
}

export interface Level {
  value: string;
  label: string;
}

export const dropdownService = {
  async getTeachers(bimestreId?: number): Promise<Teacher[]> {
    try {
      const params = bimestreId ? { bimestreId: bimestreId.toString() } : {};
      const response = await apiClient.get('/dropdown/teachers', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching teachers:', error);
      return [];
    }
  },

  async getSubjects(bimestreId?: number): Promise<Subject[]> {
    try {
      const params = bimestreId ? { bimestreId: bimestreId.toString() } : {};
      const response = await apiClient.get('/dropdown/subjects', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching subjects:', error);
      return [];
    }
  },

  async getRooms(): Promise<Room[]> {
    try {
      const response = await apiClient.get('/dropdown/rooms');
      return response.data;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return [];
    }
  },

  async getPlans(bimestreId?: number): Promise<Plan[]> {
    try {
      const params = bimestreId ? { bimestreId: bimestreId.toString() } : {};
      console.log('Llamando a /dropdown/plans con bimestreId:', bimestreId);
      const response = await apiClient.get('/dropdown/plans', { params });
      console.log('Respuesta de plans:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching plans:', error);
      return [];
    }
  },

  async getLevels(bimestreId?: number): Promise<Level[]> {
    try {
      const params = bimestreId ? { bimestreId: bimestreId.toString() } : {};
      console.log('Llamando a /dropdown/levels con bimestreId:', bimestreId);
      const response = await apiClient.get('/dropdown/levels', { params });
      console.log('Respuesta de levels:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching levels:', error);
      return [];
    }
  }
};