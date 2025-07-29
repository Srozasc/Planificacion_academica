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
  async getTeachers(): Promise<Teacher[]> {
    try {
      const response = await apiClient.get('/dropdown/teachers');
      return response.data;
    } catch (error) {
      console.error('Error fetching teachers:', error);
      return [];
    }
  },

  async getSubjects(): Promise<Subject[]> {
    try {
      const response = await apiClient.get('/dropdown/subjects');
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

  async getPlans(): Promise<Plan[]> {
    try {
      console.log('Llamando a /dropdown/plans...');
      const response = await apiClient.get('/dropdown/plans');
      console.log('Respuesta de plans:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching plans:', error);
      return [];
    }
  },

  async getLevels(): Promise<Level[]> {
    try {
      console.log('Llamando a /dropdown/levels...');
      const response = await apiClient.get('/dropdown/levels');
      console.log('Respuesta de levels:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching levels:', error);
      return [];
    }
  }
};