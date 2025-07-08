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
  type: string;
}

export interface Room {
  value: string;
  label: string;
}

export const dropdownService = {
  async getTeachers(): Promise<Teacher[]> {
    try {
      const response = await apiClient.get('/dropdowns/teachers');
      return response.data;
    } catch (error) {
      console.error('Error fetching teachers:', error);
      return [];
    }
  },

  async getSubjects(): Promise<Subject[]> {
    try {
      const response = await apiClient.get('/dropdowns/subjects');
      return response.data;
    } catch (error) {
      console.error('Error fetching subjects:', error);
      return [];
    }
  },

  async getRooms(): Promise<Room[]> {
    try {
      const response = await apiClient.get('/dropdowns/rooms');
      return response.data;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return [];
    }
  }
};