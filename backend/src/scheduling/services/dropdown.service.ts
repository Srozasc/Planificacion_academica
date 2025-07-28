import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

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
}

export interface Room {
  value: string;
  label: string;
}

@Injectable()
export class DropdownService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async getTeachers(): Promise<Teacher[]> {
    const query = `
      SELECT id, name, rut, email
      FROM teachers
      WHERE is_active = 1
      ORDER BY name ASC
    `;
    
    const teachers = await this.entityManager.query(query);
    return teachers;
  }

  async getSubjects(): Promise<Subject[]> {
    const query = `
      SELECT id, code, name, category, acronym
      FROM academic_structures
      WHERE is_active = 1
      ORDER BY name ASC
    `;
    
    const subjects = await this.entityManager.query(query);
    return subjects;
  }

  async getRooms(): Promise<Room[]> {
    const query = `
      SELECT DISTINCT room as value, room as label
      FROM schedule_events
      WHERE room IS NOT NULL AND room != '' AND active = 1
      ORDER BY room ASC
    `;
    
    const rooms = await this.entityManager.query(query);
    
    // Agregar algunas aulas comunes si no hay datos
    const defaultRooms = [
      { value: 'Aula 101', label: 'Aula 101' },
      { value: 'Aula 102', label: 'Aula 102' },
      { value: 'Aula 103', label: 'Aula 103' },
      { value: 'Lab. Física 1', label: 'Lab. Física 1' },
      { value: 'Lab. Química 1', label: 'Lab. Química 1' },
      { value: 'Lab. Sistemas 1', label: 'Lab. Sistemas 1' },
      { value: 'Lab. Sistemas 2', label: 'Lab. Sistemas 2' },
      { value: 'Auditorio', label: 'Auditorio' },
    ];

    // Combinar aulas existentes con las por defecto, evitando duplicados
    const existingValues = new Set(rooms.map(r => r.value));
    const combinedRooms = [
      ...rooms,
      ...defaultRooms.filter(room => !existingValues.has(room.value))
    ];

    return combinedRooms.sort((a, b) => a.label.localeCompare(b.label));
  }
}