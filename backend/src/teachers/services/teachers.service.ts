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
      
      // Primero obtener el id_docente del teacher
      const teacher = await this.teacherRepository.findOne({ where: { id: teacherId } });
      if (!teacher || !teacher.id_docente) {
        this.logger.warn(`Docente ${teacherId} no encontrado o sin id_docente`);
        return 0;
      }
      
      const result = await this.teacherRepository.query(`
        SELECT COALESCE(ROUND(SUM(vbr.Horas_a_pago), 0), 0) as total_horas 
        FROM Vw_Base_Reportes vbr
        WHERE vbr.ID_Docente = ? 
        AND vbr.bimestre_id = ?
      `, [teacher.id_docente, bimestreId]);

      const totalHoras = result.length > 0 ? parseFloat(result[0].total_horas) || 0 : 0;
      
      this.logger.log(`Docente ${teacherId} (ID_Docente: ${teacher.id_docente}) tiene ${totalHoras} horas asignadas en bimestre ${bimestreId}`);
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

      // Obtener los id_docente de todos los teachers
      const teachers = await this.teacherRepository.findByIds(teacherIds);
      const teacherMap = new Map<number, string>();
      const idDocenteToTeacherId = new Map<string, number>();
      
      teachers.forEach(teacher => {
        if (teacher.id_docente) {
          teacherMap.set(teacher.id, teacher.id_docente);
          idDocenteToTeacherId.set(teacher.id_docente, teacher.id);
        }
      });
      
      const validIdDocentes = Array.from(teacherMap.values());
      
      if (validIdDocentes.length === 0) {
        this.logger.warn('Ningún docente tiene id_docente válido');
        const emptyMap: Record<number, number> = {};
        teacherIds.forEach(id => {
          emptyMap[id] = 0;
        });
        return emptyMap;
      }

      const placeholders = validIdDocentes.map(() => '?').join(',');
      const result = await this.teacherRepository.query(`
        SELECT 
          vbr.ID_Docente as id_docente,
          COALESCE(ROUND(SUM(vbr.Horas_a_pago), 0), 0) as total_horas 
        FROM Vw_Base_Reportes vbr
        WHERE vbr.ID_Docente IN (${placeholders})
        AND vbr.bimestre_id = ? 
        GROUP BY vbr.ID_Docente
      `, [...validIdDocentes, bimestreId]);

      const horasMap: Record<number, number> = {};
      
      // Inicializar todos los docentes con 0 horas
      teacherIds.forEach(id => {
        horasMap[id] = 0;
      });
      
      // Actualizar con las horas reales usando el mapeo
      result.forEach(row => {
        const teacherId = idDocenteToTeacherId.get(row.id_docente);
        if (teacherId) {
          horasMap[teacherId] = parseFloat(row.total_horas) || 0;
        }
      });
      
      this.logger.log(`Horas obtenidas para docentes:`);
      this.logger.log(horasMap);
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