import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bimestre } from '../../common/entities/bimestre.entity';

/**
 * Interfaz para los parámetros de entrada del cleanup
 */
export interface CleanupParams {
  monthsThreshold?: number;  // Por defecto 24 meses
  maxBimestresPerExecution?: number;  // Por defecto 10
  debugMode?: boolean;  // Por defecto false
  performBackup?: boolean;  // Por defecto true
}

/**
 * Interfaz para los resultados del cleanup
 */
export interface CleanupResult {
  executionId: string;
  bimestresDeleted: number;
  totalRecordsDeleted: number;
  status: 'COMPLETED' | 'FAILED' | 'PARTIAL';
  errorMessage?: string;
  executionTimeSeconds: number;
  debugMode: boolean;
  monthsThreshold: number;
  maxBimestresPerExecution: number;
  performBackup: boolean;
}

/**
 * Interfaz para el detalle de registros eliminados por tabla
 */
export interface CleanupDetails {
  scheduleEventsDeleted: number;
  academicStructuresDeleted: number;
  vacantesInicioDeleted: number;
  eventTeachersDeleted: number;
  uploadLogsDeleted: number;
  dolAprobadosDeleted: number;
  asignaturasOptativasDeleted: number;
  bimestresProcessedIds: string;
}

@Injectable()
export class BimestreCleanupService {
  private readonly logger = new Logger(BimestreCleanupService.name);

  constructor(
    @InjectRepository(Bimestre)
    private readonly bimestreRepository: Repository<Bimestre>,
  ) {}

  /**
   * Ejecuta el proceso de limpieza de bimestres obsoletos
   * @param params Parámetros de configuración del cleanup
   * @returns Resultado de la ejecución
   */
  async executeCleanup(params: CleanupParams = {}): Promise<CleanupResult> {
    const startTime = Date.now();
    
    // Establecer valores por defecto
    const {
      monthsThreshold = 24,
      maxBimestresPerExecution = 10,
      debugMode = false,
      performBackup = true
    } = params;

    this.logger.log(`Iniciando cleanup de bimestres con parámetros: ` +
      `monthsThreshold=${monthsThreshold}, maxBimestres=${maxBimestresPerExecution}, ` +
      `debug=${debugMode}, backup=${performBackup}`);

    try {
      // Ejecutar el Stored Procedure
      const result = await this.bimestreRepository.query(
        'CALL sp_cleanup_old_bimestres(?, ?, ?, ?, @execution_id, @bimestres_deleted, @total_records_deleted, @status, @error_message)',
        [monthsThreshold, maxBimestresPerExecution, debugMode, performBackup]
      );

      // Obtener los valores de salida
      const outputResult = await this.bimestreRepository.query(
        'SELECT @execution_id as execution_id, @bimestres_deleted as bimestres_deleted, ' +
        '@total_records_deleted as total_records_deleted, @status as status, @error_message as error_message'
      );

      const output = outputResult[0];
      const executionTimeSeconds = (Date.now() - startTime) / 1000;

      const cleanupResult: CleanupResult = {
        executionId: output.execution_id,
        bimestresDeleted: parseInt(output.bimestres_deleted) || 0,
        totalRecordsDeleted: parseInt(output.total_records_deleted) || 0,
        status: output.status,
        errorMessage: output.error_message,
        executionTimeSeconds,
        debugMode,
        monthsThreshold,
        maxBimestresPerExecution,
        performBackup
      };

      if (cleanupResult.status === 'COMPLETED') {
        this.logger.log(`Cleanup completado exitosamente. ` +
          `Bimestres eliminados: ${cleanupResult.bimestresDeleted}, ` +
          `Registros totales: ${cleanupResult.totalRecordsDeleted}, ` +
          `Tiempo: ${cleanupResult.executionTimeSeconds}s`);
      } else {
        this.logger.warn(`Cleanup terminó con estado: ${cleanupResult.status}. ` +
          `Error: ${cleanupResult.errorMessage}`);
      }

      return cleanupResult;

    } catch (error) {
      const executionTimeSeconds = (Date.now() - startTime) / 1000;
      
      this.logger.error(`Error durante el cleanup de bimestres: ${error.message}`, error.stack);
      
      return {
        executionId: 'ERROR',
        bimestresDeleted: 0,
        totalRecordsDeleted: 0,
        status: 'FAILED',
        errorMessage: error.message,
        executionTimeSeconds,
        debugMode,
        monthsThreshold,
        maxBimestresPerExecution,
        performBackup
      };
    }
  }

  /**
   * Obtiene los detalles de una ejecución específica desde los logs
   * @param executionId ID de la ejecución
   * @returns Detalles de la ejecución o null si no se encuentra
   */
  async getCleanupDetails(executionId: string): Promise<CleanupDetails | null> {
    try {
      const result = await this.bimestreRepository.query(
        'SELECT schedule_events_deleted, academic_structures_deleted, vacantes_inicio_deleted, ' +
        'event_teachers_deleted, upload_logs_deleted, dol_aprobados_deleted, ' +
        'asignaturas_optativas_deleted, bimestres_processed_ids ' +
        'FROM cleanup_logs WHERE execution_id = ? LIMIT 1',
        [executionId]
      );

      if (result.length === 0) {
        return null;
      }

      const row = result[0];
      return {
        scheduleEventsDeleted: row.schedule_events_deleted || 0,
        academicStructuresDeleted: row.academic_structures_deleted || 0,
        vacantesInicioDeleted: row.vacantes_inicio_deleted || 0,
        eventTeachersDeleted: row.event_teachers_deleted || 0,
        uploadLogsDeleted: row.upload_logs_deleted || 0,
        dolAprobadosDeleted: row.dol_aprobados_deleted || 0,
        asignaturasOptativasDeleted: row.asignaturas_optativas_deleted || 0,
        bimestresProcessedIds: row.bimestres_processed_ids || ''
      };

    } catch (error) {
      this.logger.error(`Error al obtener detalles del cleanup ${executionId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Obtiene el historial de ejecuciones de cleanup
   * @param limit Número máximo de registros a retornar
   * @returns Lista de ejecuciones
   */
  async getCleanupHistory(limit: number = 50): Promise<any[]> {
    try {
      const result = await this.bimestreRepository.query(
        'SELECT execution_id, execution_date, status, bimestres_identified, bimestres_deleted, ' +
        'total_records_deleted, execution_time_seconds, debug_mode, months_threshold, ' +
        'max_bimestres_per_execution, perform_backup, error_message ' +
        'FROM cleanup_logs ORDER BY execution_date DESC LIMIT ?',
        [limit]
      );

      return result;

    } catch (error) {
      this.logger.error(`Error al obtener historial de cleanup: ${error.message}`);
      return [];
    }
  }

  /**
   * Identifica bimestres candidatos para limpieza sin ejecutar la eliminación
   * @param monthsThreshold Umbral en meses
   * @returns Lista de bimestres candidatos
   */
  async identifyCandidates(monthsThreshold: number = 24): Promise<any[]> {
    try {
      const result = await this.bimestreRepository.query(
        'SELECT id, nombre, fechaInicio, fechaFin, anoAcademico, ' +
        'TIMESTAMPDIFF(MONTH, fechaFin, NOW()) as meses_desde_fin ' +
        'FROM bimestres ' +
        'WHERE activo = 0 AND TIMESTAMPDIFF(MONTH, fechaFin, NOW()) >= ? ' +
        'ORDER BY fechaFin ASC',
        [monthsThreshold]
      );

      this.logger.log(`Identificados ${result.length} bimestres candidatos para limpieza ` +
        `con umbral de ${monthsThreshold} meses`);

      return result;

    } catch (error) {
      this.logger.error(`Error al identificar candidatos: ${error.message}`);
      return [];
    }
  }

  /**
   * Cron job que se ejecuta automáticamente el 1 de enero a las 2:00 AM
   * Ejecuta la limpieza anual de bimestres antiguos
   */
  @Cron('0 2 1 1 *', {
    name: 'annual-bimestre-cleanup',
    timeZone: 'America/Mexico_City',
  })
  async executeAnnualCleanup(): Promise<void> {
    this.logger.log('Iniciando limpieza automática anual de bimestres');
    
    try {
      const result = await this.executeCleanup({
        monthsThreshold: 24, // 2 años por defecto
        maxBimestresPerExecution: 10, // Mantener al menos 10 bimestres por ejecución
        debugMode: false,
        performBackup: true,
      });
      
      this.logger.log(`Limpieza anual completada: ${result.bimestresDeleted} bimestres eliminados, ${result.totalRecordsDeleted} registros totales eliminados`);
    } catch (error) {
      this.logger.error('Error en limpieza automática anual:', error);
      throw error;
    }
  }

  /**
   * Valida los parámetros de entrada para el cleanup
   * @param params Parámetros a validar
   * @returns Array de errores de validación (vacío si es válido)
   */
  validateCleanupParams(params: CleanupParams): string[] {
    const errors: string[] = [];

    if (params.monthsThreshold !== undefined) {
      if (params.monthsThreshold < 6) {
        errors.push('El umbral mínimo de meses debe ser 6');
      }
      if (params.monthsThreshold > 120) {
        errors.push('El umbral máximo de meses debe ser 120');
      }
    }

    if (params.maxBimestresPerExecution !== undefined) {
      if (params.maxBimestresPerExecution < 1 || params.maxBimestresPerExecution > 50) {
        errors.push('El máximo de bimestres por ejecución debe estar entre 1 y 50');
      }
    }

    return errors;
  }
}