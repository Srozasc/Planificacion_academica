import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

export interface Teacher {
  id: number;
  name: string;
  rut: string;
  email: string;
  id_docente?: string;
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

@Injectable()
export class DropdownService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async getTeachers(bimestreId?: number): Promise<Teacher[]> {
    let query = `
      SELECT id, name, rut, email, id_docente
      FROM teachers
      WHERE is_active = 1
    `;
    
    const params = [];
    
    // Si se proporciona bimestre_id, filtrar por bimestre
    if (bimestreId) {
      query += ` AND id_bimestre = ?`;
      params.push(bimestreId);
    }
    
    query += ` ORDER BY name ASC`;
    
    const teachers = await this.entityManager.query(query, params);
    return teachers;
  }

  async getSubjects(bimestreId?: number): Promise<Subject[]> {
    let query = `
      SELECT id, code, name, category, acronym, course, code as plan_code, level
      FROM academic_structures
      WHERE is_active = 1
    `;
    
    const params = [];
    
    // Si se proporciona bimestre_id, filtrar por bimestre
    if (bimestreId) {
      query += ` AND id_bimestre = ?`;
      params.push(bimestreId);
    }
    
    query += ` ORDER BY name ASC`;
    
    const subjects = await this.entityManager.query(query, params);
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

  async getPlans(bimestreId?: number): Promise<Plan[]> {
    let query = `
      SELECT DISTINCT code as value, code as label
      FROM academic_structures
      WHERE code IS NOT NULL AND code != '' AND is_active = 1
    `;
    
    const params = [];
    
    // Si se proporciona bimestre_id, filtrar por bimestre
    if (bimestreId) {
      query += ` AND id_bimestre = ?`;
      params.push(bimestreId);
    }
    
    query += ` ORDER BY code ASC`;
    
    console.log('DEBUG: Ejecutando consulta getPlans:', query, 'con parámetros:', params);
    const plans = await this.entityManager.query(query, params);
    console.log('DEBUG: Resultado getPlans:', plans);
    console.log('DEBUG: Número de planes encontrados:', plans.length);
    return plans;
  }

  async getLevels(bimestreId?: number): Promise<Level[]> {
    let query = `
      SELECT DISTINCT level as value, level as label
      FROM academic_structures
      WHERE level IS NOT NULL AND level != '' AND is_active = 1
    `;
    
    const params = [];
    
    // Si se proporciona bimestre_id, filtrar por bimestre
    if (bimestreId) {
      query += ` AND id_bimestre = ?`;
      params.push(bimestreId);
    }
    
    query += ` ORDER BY level ASC`;
    
    console.log('DEBUG: Ejecutando consulta getLevels:', query, 'con parámetros:', params);
    const levels = await this.entityManager.query(query, params);
    console.log('DEBUG: Resultado getLevels:', levels);
    console.log('DEBUG: Número de niveles encontrados:', levels.length);
    return levels;
  }

  // Métodos para cargar datos desde vacantes_inicio_permanente (tipo "Inicio")
  async getPlansInicio(bimestreId?: number): Promise<Plan[]> {
    let query = `
      SELECT DISTINCT codigo_plan as value, codigo_plan as label
      FROM vacantes_inicio_permanente
      WHERE codigo_plan IS NOT NULL AND codigo_plan != '' AND activo = 1
    `;
    
    const params = [];
    
    // Si se proporciona bimestre_id, filtrar por bimestre
    if (bimestreId) {
      query += ` AND id_bimestre = ?`;
      params.push(bimestreId);
    }
    
    query += ` ORDER BY codigo_plan ASC`;
    
    console.log('DEBUG: Ejecutando consulta getPlansInicio:', query, 'con parámetros:', params);
    const plans = await this.entityManager.query(query, params);
    console.log('DEBUG: Resultado getPlansInicio:', plans);
    console.log('DEBUG: Número de planes de inicio encontrados:', plans.length);
    return plans;
  }

  async getLevelsInicio(bimestreId?: number): Promise<Level[]> {
    let query = `
      SELECT DISTINCT nivel as value, nivel as label
      FROM vacantes_inicio_permanente
      WHERE nivel IS NOT NULL AND nivel != '' AND activo = 1
    `;
    
    const params = [];
    
    // Si se proporciona bimestre_id, filtrar por bimestre
    if (bimestreId) {
      query += ` AND id_bimestre = ?`;
      params.push(bimestreId);
    }
    
    query += ` ORDER BY nivel ASC`;
    
    console.log('DEBUG: Ejecutando consulta getLevelsInicio:', query, 'con parámetros:', params);
    const levels = await this.entityManager.query(query, params);
    console.log('DEBUG: Resultado getLevelsInicio:', levels);
    console.log('DEBUG: Número de niveles de inicio encontrados:', levels.length);
    return levels;
  }

  async getSubjectsInicio(bimestreId?: number): Promise<Subject[]> {
    let query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY sigla_asignatura) as id,
        codigo_plan as code,
        asignatura as name,
        'INICIO' as category,
        sigla_asignatura as acronym,
        asignatura as course,
        codigo_plan as plan_code,
        nivel as level
      FROM vacantes_inicio_permanente
      WHERE sigla_asignatura IS NOT NULL AND sigla_asignatura != '' 
        AND asignatura IS NOT NULL AND asignatura != '' 
        AND activo = 1
    `;
    
    const params = [];
    
    // Si se proporciona bimestre_id, filtrar por bimestre
    if (bimestreId) {
      query += ` AND id_bimestre = ?`;
      params.push(bimestreId);
    }
    
    query += ` ORDER BY sigla_asignatura ASC`;
    
    console.log('DEBUG: Ejecutando consulta getSubjectsInicio:', query, 'con parámetros:', params);
    const subjects = await this.entityManager.query(query, params);
    console.log('DEBUG: Resultado getSubjectsInicio:', subjects);
    console.log('DEBUG: Número de asignaturas de inicio encontradas:', subjects.length);
    return subjects;
  }

  // Método para obtener asignaturas filtradas por permisos del usuario
  async getSubjectsWithPermissions(userId: number, bimestreId?: number): Promise<Subject[]> {
    console.log('DEBUG: getSubjectsWithPermissions llamado con userId:', userId, 'bimestreId:', bimestreId);
    
    let query = `
      SELECT DISTINCT
        a.id,
        a.code,
        a.name,
        a.category,
        a.acronym,
        a.course,
        a.code as plan_code,
        a.level
      FROM academic_structures a
      WHERE a.is_active = 1
        AND a.acronym IN (
          SELECT DISTINCT uap.sigla
          FROM usuario_asignaturas_permitidas uap
          WHERE uap.usuario_id = ?
        )
    `;
    
    const params = [userId];
    
    // Si se proporciona bimestre_id, filtrar por bimestre
    if (bimestreId) {
      query = `
        SELECT DISTINCT
          a.id,
          a.code,
          a.name,
          a.category,
          a.acronym,
          a.course,
          a.code as plan_code,
          a.level
        FROM academic_structures a
        WHERE a.is_active = 1
          AND a.id_bimestre = ?
          AND a.acronym IN (
            SELECT DISTINCT uap.sigla
            FROM usuario_asignaturas_permitidas uap
            WHERE uap.usuario_id = ? AND uap.bimestre_id = ?
          )
      `;
      params.splice(0, params.length, bimestreId, userId, bimestreId);
    }
    
    query += ` ORDER BY a.name ASC`;
    
    console.log('DEBUG: Ejecutando consulta getSubjectsWithPermissions:', query, 'con parámetros:', params);
    const subjects = await this.entityManager.query(query, params);
    console.log('DEBUG: Resultado getSubjectsWithPermissions:', subjects);
    console.log('DEBUG: Número de asignaturas con permisos encontradas:', subjects.length);
    return subjects;
  }

  // Método para obtener asignaturas de inicio filtradas por permisos del usuario
  async getSubjectsInicioWithPermissions(userId: number, bimestreId?: number): Promise<Subject[]> {
    // Para asignaturas de inicio, necesitamos verificar permisos por código de plan o categoría INICIO
    let query = `
      SELECT DISTINCT
        ROW_NUMBER() OVER (ORDER BY v.sigla_asignatura) as id,
        v.codigo_plan as code,
        v.asignatura as name,
        'INICIO' as category,
        v.sigla_asignatura as acronym,
        v.asignatura as course,
        v.codigo_plan as plan_code,
        v.nivel as level
      FROM vacantes_inicio_permanente v
      WHERE v.sigla_asignatura IS NOT NULL AND v.sigla_asignatura != '' 
        AND v.asignatura IS NOT NULL AND v.asignatura != '' 
        AND v.activo = 1
        AND (
          -- Verificar permisos por carrera (código de plan)
          EXISTS (
            SELECT 1 FROM usuario_permisos_carrera upc
            JOIN carreras c ON upc.carrera_id = c.id
            WHERE upc.usuario_id = ? AND c.codigo_plan = v.codigo_plan AND upc.activo = 1
          )
          OR
          -- Verificar permisos por categoría INICIO
          EXISTS (
            SELECT 1 FROM usuario_permisos_categoria upcat
            WHERE upcat.usuario_id = ? AND upcat.categoria = 'INICIO' AND upcat.activo = 1
          )
        )
    `;
    
    let params = [userId, userId];
    
    // Si se proporciona bimestre_id, filtrar por bimestre
    if (bimestreId) {
      query += ` AND v.id_bimestre = ?`;
      // También filtrar los permisos por bimestre
      query = query.replace(
        'WHERE upc.usuario_id = ? AND c.codigo_plan = v.codigo_plan AND upc.activo = 1',
        'WHERE upc.usuario_id = ? AND c.codigo_plan = v.codigo_plan AND upc.activo = 1 AND upc.bimestre_id = ?'
      );
      query = query.replace(
        'WHERE upcat.usuario_id = ? AND upcat.categoria = \'INICIO\' AND upcat.activo = 1',
        'WHERE upcat.usuario_id = ? AND upcat.categoria = \'INICIO\' AND upcat.activo = 1 AND upcat.bimestre_id = ?'
      );
      // Reemplazar completamente el array de parámetros con el orden correcto
      params = [userId, bimestreId, userId, bimestreId, bimestreId];
    }
    
    query += ` ORDER BY v.sigla_asignatura ASC`;
    
    console.log('DEBUG: Ejecutando consulta getSubjectsInicioWithPermissions:', query, 'con parámetros:', params);
    const subjects = await this.entityManager.query(query, params);
    console.log('DEBUG: Resultado getSubjectsInicioWithPermissions:', subjects);
    console.log('DEBUG: Número de asignaturas de inicio con permisos encontradas:', subjects.length);
    return subjects;
  }
}