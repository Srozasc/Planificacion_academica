import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from '../entities/teacher.entity';

@Injectable()
export class TeachersService {
  private readonly logger = new Logger(TeachersService.name);

  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
  ) {}

  /**
   * Obtiene el total de horas asignadas a un docente en un bimestre específico
   * @param teacherId ID del docente
   * @param bimestreId ID del bimestre
   * @returns Total de horas asignadas
   */
  async getTeacherAssignedHours(teacherId: number, bimestreId: number): Promise<number> {
    try {
      this.logger.log(`Obteniendo horas asignadas para docente ${teacherId} en bimestre ${bimestreId}`);
      
      const result = await this.teacherRepository.query(`
        SELECT COALESCE(SUM(as2.hours), 0) as total_horas 
        FROM event_teachers et  
        LEFT JOIN academic_structures as2 
        ON et.event_id = as2.id 
        LEFT JOIN schedule_events se  
        ON se.subject = as2.acronym 
        WHERE et.teacher_id = ? 
        AND et.id_bimestre = ? 
        GROUP BY et.teacher_id
      `, [teacherId, bimestreId]);

      const totalHoras = result.length > 0 ? parseFloat(result[0].total_horas) || 0 : 0;
      
      this.logger.log(`Docente ${teacherId} tiene ${totalHoras} horas asignadas en bimestre ${bimestreId}`);
      return totalHoras;
    } catch (error) {
      this.logger.error(`Error al obtener horas asignadas para docente ${teacherId}:`, error);
      return 0;
    }
  }

  /**
   * Obtiene las horas asignadas para múltiples docentes en un bimestre
   * @param teacherIds Array de IDs de docentes
   * @param bimestreId ID del bimestre
   * @returns Objeto con teacherId como clave y horas como valor
   */
  async getMultipleTeachersAssignedHours(teacherIds: number[], bimestreId: number): Promise<Record<number, number>> {
    try {
      this.logger.log(`Obteniendo horas asignadas para ${teacherIds.length} docentes en bimestre ${bimestreId}`);
      
      if (teacherIds.length === 0) {
        return {};
      }

      const placeholders = teacherIds.map(() => '?').join(',');
      const result = await this.teacherRepository.query(`
        SELECT 
          et.teacher_id,
          COALESCE(SUM(as2.hours), 0) as total_horas 
        FROM event_teachers et  
        LEFT JOIN academic_structures as2 
        ON et.event_id = as2.id 
        LEFT JOIN schedule_events se  
        ON se.subject = as2.acronym 
        WHERE et.teacher_id IN (${placeholders})
        AND et.id_bimestre = ? 
        GROUP BY et.teacher_id
      `, [...teacherIds, bimestreId]);

      const horasMap: Record<number, number> = {};
      
      // Inicializar todos los docentes con 0 horas
      teacherIds.forEach(id => {
        horasMap[id] = 0;
      });
      
      // Actualizar con las horas reales
      result.forEach(row => {
        horasMap[row.teacher_id] = parseFloat(row.total_horas) || 0;
      });
      
      this.logger.log(`Horas obtenidas para docentes:`, horasMap);
      return horasMap;
    } catch (error) {
      this.logger.error(`Error al obtener horas asignadas para múltiples docentes:`, error);
      // Retornar objeto con 0 horas para todos los docentes en caso de error
      const errorMap: Record<number, number> = {};
      teacherIds.forEach(id => {
        errorMap[id] = 0;
      });
      return errorMap;
    }
  }
}