import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { StagingAdolSimple } from '../adol/entities/adol-position.entity';
import { StagingDol } from '../dol/entities/dol-position.entity';
import { StagingVacantesInicio } from '../vacantes-inicio/entities/vacantes-inicio.entity';
import { StagingEstructuraAcademica } from '../estructura-academica/entities/estructura-academica.entity';
import { AcademicStructure } from '../academic/entities/academic-structure.entity';
import { StagingReporteCursables } from '../reporte-cursables/entities/reporte-cursables.entity';
import { StagingNominaDocentes } from '../nomina-docentes/entities/nomina-docentes.entity';
import { UploadLog } from './entities/upload-log.entity';
import { ResponseService } from '../common/services/response.service';
import { unlinkSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ProcessOptions {
  mode: string;
  validateOnly: boolean;
  bimestreId: number;
}

interface UploadResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
  warnings?: string[];
  summary?: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    errors?: string[];
  };
  stats?: {
    total: number;
    processed: number;
    created: number;
    updated: number;
    errors: number;
  };
}

interface SystemStats {
  totalTeachers: number;
  totalAcademicStructures: number;
  totalCourseReports: number;
  totalAdolPositions: number;
  lastUploadDate: Date;
  systemHealth: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    @InjectRepository(StagingAdolSimple)
    private stagingAdolRepository: Repository<StagingAdolSimple>,
    @InjectRepository(StagingDol)
    private stagingDolRepository: Repository<StagingDol>,
    @InjectRepository(StagingVacantesInicio)
    private stagingVacantesInicioRepository: Repository<StagingVacantesInicio>,
    @InjectRepository(StagingEstructuraAcademica)
    private stagingEstructuraAcademicaRepository: Repository<StagingEstructuraAcademica>,
    @InjectRepository(AcademicStructure)
    private academicStructureRepository: Repository<AcademicStructure>,
    @InjectRepository(StagingReporteCursables)
    private stagingReporteCursablesRepository: Repository<StagingReporteCursables>,
    @InjectRepository(StagingNominaDocentes)
    private stagingNominaDocentesRepository: Repository<StagingNominaDocentes>,
    @InjectRepository(UploadLog)
    private readonly uploadLogRepository: Repository<UploadLog>,
    private readonly responseService: ResponseService,
    private dataSource: DataSource, ) {}

  /**
   * Registra una operación de carga en la tabla upload_logs
   */
  private async logUpload(
    fileName: string,
    uploadType: string,
    bimestreId: number,
    status: 'Exitoso' | 'Con errores' | 'Error',
    totalRecords: number = 0,
    errorCount: number = 0,
    userId: number = null,
    errorDetails: string = null
  ): Promise<void> {
    try {
      // Eliminar registros pendientes anteriores del mismo tipo y bimestre para todos los tipos de archivo
      this.logger.log(`Eliminando registros ${uploadType} pendientes anteriores para bimestre ${bimestreId}...`);
      const deletedCount = await this.uploadLogRepository.delete({
        uploadType: uploadType,
        bimestreId: bimestreId,
        approvalStatus: 'Pendiente'
      });
      this.logger.log(`Registros ${uploadType} pendientes eliminados: ${deletedCount.affected || 0}`);

      const uploadLog = this.uploadLogRepository.create({
        fileName,
        uploadType,
        bimestreId,
        status,
        totalRecords,
        errorCount,
        userId,
        errorDetails,
        approvalStatus: 'Pendiente',
        isProcessed: false
      });

      await this.uploadLogRepository.save(uploadLog);
      this.logger.log(`Registro de carga guardado: ${fileName} - ${uploadType} - ${status}`);
    } catch (error) {
      this.logger.error(`Error al guardar registro de carga: ${error.message}`);
      // No lanzamos el error para no interrumpir el proceso principal
    }
  }

  async processDol(file: Express.Multer.File, options: ProcessOptions, userId?: number): Promise<UploadResult> {
    try {
      this.logger.log('=== INICIO PROCESS DOL SERVICE ===');
      this.logger.log(`Procesando archivo DOL: ${file.originalname}`);
      this.logger.log(`Tamaño buffer: ${file.buffer.length} bytes`);
      this.logger.log(`Opciones recibidas: ${JSON.stringify(options)}`);

      // Read Excel file
      this.logger.log('Leyendo archivo Excel...');
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      this.logger.log(`Hojas encontradas: ${workbook.SheetNames.join(', ')}`);
      
      const sheetName = workbook.SheetNames[0];
      this.logger.log(`Procesando hoja: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      this.logger.log(`Datos leídos del Excel: ${data.length} filas`);
      this.logger.log('Primeras 3 filas de datos:', JSON.stringify(data.slice(0, 3), null, 2));

      // Validate data
      this.logger.log('Iniciando validación de datos...');
      const validation = this.validateDolData(data);
      
      this.logger.log(`Validación completada:`);
      this.logger.log(`- Es válido: ${validation.isValid}`);
      this.logger.log(`- Registros válidos: ${validation.validRecords.length}`);
      this.logger.log(`- Errores: ${validation.errors.length}`);
      
      if (validation.errors.length > 0) {
        this.logger.log('Errores de validación:', JSON.stringify(validation.errors, null, 2));
      }
      
      if (!validation.isValid) {
        this.logger.log('Retornando resultado con errores de validación');
        
        // Registrar carga con errores
        await this.logUpload(
          file.originalname,
          'DOL',
          options.bimestreId,
          'Con errores',
          data.length,
          data.length - validation.validRecords.length,
          userId,
          validation.errors.join('; ')
        );
        
        return {
          success: false,
          message: 'Errores de validación encontrados',
          summary: {
            totalRecords: data.length,
            validRecords: validation.validRecords.length,
            invalidRecords: data.length - validation.validRecords.length,
            errors: validation.errors
          }
        };
      }

      // Save data if not validation only
      if (!options.validateOnly) {
        this.logger.log(`Guardando ${validation.validRecords.length} registros válidos en BD...`);
        this.logger.log(`BimestreId para guardar: ${options.bimestreId}`);
        
        const savedRecords = await this.saveDolData(validation.validRecords, options.bimestreId);
        
        this.logger.log(`Registros guardados exitosamente: ${savedRecords.length}`);
        
        // Registrar carga exitosa
        await this.logUpload(
          file.originalname,
          'DOL',
          options.bimestreId,
          validation.errors.length > 0 ? 'Con errores' : 'Exitoso',
          data.length,
          data.length - savedRecords.length,
          userId,
          validation.errors.length > 0 ? validation.errors.join('; ') : null
        );
        
        const result = {
          success: true,
          message: `DOL procesado exitosamente. ${savedRecords.length} registros guardados.`,
          summary: {
            totalRecords: data.length,
            validRecords: savedRecords.length,
            invalidRecords: data.length - savedRecords.length,
            errors: validation.errors
          }
        };
        
        this.logger.log('=== RESULTADO FINAL PROCESS DOL ===');
        this.logger.log(JSON.stringify(result, null, 2));
        
        return result;
      } else {
        this.logger.log('Modo validación solamente, no guardando en BD');
        
        // Registrar validación (sin guardar datos)
        await this.logUpload(
          file.originalname,
          'DOL (Validación)',
          options.bimestreId,
          validation.errors.length > 0 ? 'Con errores' : 'Exitoso',
          data.length,
          data.length - validation.validRecords.length,
          userId, // Usuario que realiza la carga
          validation.errors.length > 0 ? validation.errors.join('; ') : null
        );
        
        return {
          success: true,
          message: 'Validación completada exitosamente',
          summary: {
            totalRecords: data.length,
            validRecords: validation.validRecords.length,
            invalidRecords: data.length - validation.validRecords.length,
            errors: validation.errors
          }
        };
      }
    } catch (error) {
      this.logger.error('=== ERROR EN PROCESS DOL SERVICE ===');
      this.logger.error(`Error procesando archivo DOL: ${error.message}`);
      this.logger.error('Stack trace completo:', error.stack);
      
      // Registrar error crítico
      await this.logUpload(
        file.originalname,
        'DOL',
        options.bimestreId,
        'Error',
        0,
        0,
        userId, // Usuario que realiza la carga
        error.message
      );
      
      throw new Error(`Error procesando archivo DOL: ${error.message}`);
    }
  }

  async processAdol(file: Express.Multer.File, options: ProcessOptions, userId?: number): Promise<UploadResult> {
    try {
      this.logger.log('=== INICIO PROCESS ADOL SERVICE ===');
      this.logger.log(`Procesando archivo ADOL: ${file.originalname}`);
      this.logger.log(`Tamaño buffer: ${file.buffer.length} bytes`);
      this.logger.log(`Opciones recibidas: ${JSON.stringify(options)}`);

      // Read Excel file
      this.logger.log('Leyendo archivo Excel...');
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      this.logger.log(`Hojas encontradas: ${workbook.SheetNames.join(', ')}`);
      
      const sheetName = workbook.SheetNames[0];
      this.logger.log(`Procesando hoja: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      this.logger.log(`Datos leídos del Excel: ${data.length} filas`);
      this.logger.log('Primeras 3 filas de datos:', JSON.stringify(data.slice(0, 3), null, 2));

      // Validate data
      this.logger.log('Iniciando validación de datos...');
      const validation = this.validateAdolData(data);
      
      this.logger.log(`Validación completada:`);
      this.logger.log(`- Es válido: ${validation.isValid}`);
      this.logger.log(`- Registros válidos: ${validation.validRecords.length}`);
      this.logger.log(`- Errores: ${validation.errors.length}`);
      
      if (validation.errors.length > 0) {
        this.logger.log('Errores de validación:', JSON.stringify(validation.errors, null, 2));
      }
      
      if (!validation.isValid) {
        this.logger.log('Retornando resultado con errores de validación');
        
        // Registrar carga con errores
        await this.logUpload(
          file.originalname,
          'ADOL',
          options.bimestreId,
          'Con errores',
          data.length,
          data.length - validation.validRecords.length,
          userId,
          validation.errors.join('; ')
        );
        
        return {
          success: false,
          message: 'Errores de validación encontrados',
          summary: {
            totalRecords: data.length,
            validRecords: validation.validRecords.length,
            invalidRecords: data.length - validation.validRecords.length,
            errors: validation.errors
          }
        };
      }

      // Save data if not validation only
      if (!options.validateOnly) {
        this.logger.log(`Guardando ${validation.validRecords.length} registros válidos en BD...`);
        this.logger.log(`BimestreId para guardar: ${options.bimestreId}`);
        
        const savedRecords = await this.saveAdolData(validation.validRecords, options.bimestreId);
        
        this.logger.log(`Registros guardados exitosamente: ${savedRecords.length}`);
        
        // Registrar carga exitosa
        await this.logUpload(
          file.originalname,
          'ADOL',
          options.bimestreId,
          validation.errors.length > 0 ? 'Con errores' : 'Exitoso',
          data.length,
          data.length - savedRecords.length,
          userId,
          validation.errors.length > 0 ? validation.errors.join('; ') : null
        );
        
        const result = {
          success: true,
          message: `ADOL procesado exitosamente. ${savedRecords.length} registros guardados.`,
          summary: {
            totalRecords: data.length,
            validRecords: savedRecords.length,
            invalidRecords: data.length - savedRecords.length,
            errors: validation.errors
          }
        };
        
        this.logger.log('=== RESULTADO FINAL PROCESS ADOL ===');
        this.logger.log(JSON.stringify(result, null, 2));
        
        return result;
      } else {
        this.logger.log('Modo validación solamente, no guardando en BD');
        
        // Registrar validación (sin guardar datos)
        await this.logUpload(
          file.originalname,
          'ADOL (Validación)',
          options.bimestreId,
          validation.errors.length > 0 ? 'Con errores' : 'Exitoso',
          data.length,
          data.length - validation.validRecords.length,
          userId, // Usuario que realiza la carga
          validation.errors.length > 0 ? validation.errors.join('; ') : null
        );
        
        return {
          success: true,
          message: 'Validación completada exitosamente',
          summary: {
            totalRecords: data.length,
            validRecords: validation.validRecords.length,
            invalidRecords: data.length - validation.validRecords.length,
            errors: validation.errors
          }
        };
      }
    } catch (error) {
      this.logger.error('=== ERROR EN PROCESS ADOL SERVICE ===');
      this.logger.error(`Error procesando archivo ADOL: ${error.message}`);
      this.logger.error('Stack trace completo:', error.stack);
      
      // Registrar error crítico
      await this.logUpload(
        file.originalname,
        'ADOL',
        options.bimestreId,
        'Error',
        0,
        0,
        userId, // Usuario que realiza la carga
        error.message
      );
      
      throw new Error(`Error procesando archivo ADOL: ${error.message}`);
    }
  }



  private validateAdolData(data: any[]): { isValid: boolean; errors: string[]; validRecords: any[] } {
    const errors: string[] = [];
    const validRecords: any[] = [];

    if (!data || data.length === 0) {
      errors.push('El archivo está vacío o no contiene datos válidos');
      return { isValid: false, errors, validRecords };
    }

    data.forEach((row, index) => {
      const rowErrors: string[] = [];
      const rowNumber = index + 2; // +2 porque Excel empieza en 1 y la primera fila son headers

      // Validar campos requeridos
      if (!row.SIGLA && !row.sigla) {
        rowErrors.push(`Fila ${rowNumber}: SIGLA es requerida`);
      }

      if (!row.DESCRIPCION && !row.descripcion && !row.DESCRIPCIÓN) {
        rowErrors.push(`Fila ${rowNumber}: DESCRIPCION es requerida`);
      }

      // Validar longitud de campos
      const sigla = row.SIGLA || row.sigla;
      const descripcion = row.DESCRIPCION || row.descripcion || row.DESCRIPCIÓN;

      if (sigla && sigla.length > 20) {
        rowErrors.push(`Fila ${rowNumber}: SIGLA no puede exceder 20 caracteres`);
      }

      if (descripcion && descripcion.length > 500) {
        rowErrors.push(`Fila ${rowNumber}: DESCRIPCION no puede exceder 500 caracteres`);
      }

      if (rowErrors.length === 0) {
        validRecords.push({
          SIGLA: sigla,
          DESCRIPCION: descripcion,
        });
      } else {
        errors.push(...rowErrors);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      validRecords,
    };
  }



  private async saveAdolData(data: any[], bimestreId: number): Promise<StagingAdolSimple[]> {
    this.logger.log('=== INICIO SAVE ADOL DATA ===');
    this.logger.log(`Datos a guardar: ${data.length} registros`);
    this.logger.log(`BimestreId: ${bimestreId}`);
    this.logger.log('Primeros 2 registros a guardar:', JSON.stringify(data.slice(0, 2), null, 2));
    
    const records: StagingAdolSimple[] = [];

    try {
      // Limpiar todos los datos existentes en la tabla staging
      this.logger.log('Eliminando todos los registros existentes de la tabla staging_adol_simple...');
      await this.stagingAdolRepository.clear();
      this.logger.log('Tabla staging_adol_simple limpiada completamente');

      this.logger.log('Iniciando inserción de nuevos registros...');
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        this.logger.log(`Procesando registro ${i + 1}/${data.length}:`, JSON.stringify(row));
        
        const record = new StagingAdolSimple();
        record.SIGLA = row.SIGLA || row.sigla;
        record.DESCRIPCION = row.DESCRIPCION || row.descripcion;
        record.id_bimestre = bimestreId;
        
        this.logger.log(`Entidad creada:`, {
          SIGLA: record.SIGLA,
          DESCRIPCION: record.DESCRIPCION,
          id_bimestre: record.id_bimestre
        });
        
        try {
          const savedRecord = await this.stagingAdolRepository.save(record);
           this.logger.log(`Registro ${i + 1} guardado exitosamente - SIGLA: ${savedRecord.SIGLA}, Bimestre: ${savedRecord.id_bimestre}`);
           records.push(savedRecord);
        } catch (saveError) {
          this.logger.error(`Error guardando registro ${i + 1}:`, saveError.message);
          throw saveError;
        }
      }

      this.logger.log(`=== SAVE ADOL DATA COMPLETADO ===`);
      this.logger.log(`Total registros guardados: ${records.length}`);
      
      // Verificar que los datos se guardaron
      const countAfter = await this.stagingAdolRepository.count({ where: { id_bimestre: bimestreId } });
      this.logger.log(`Verificación: registros en BD para bimestre ${bimestreId}: ${countAfter}`);
      
      return records;
    } catch (error) {
      this.logger.error('=== ERROR EN SAVE ADOL DATA ===');
      this.logger.error('Error guardando datos ADOL:', error.message);
      this.logger.error('Stack trace:', error.stack);
      throw error;
    }
  }

  private validateDolData(data: any[]): { isValid: boolean; errors: string[]; validRecords: any[] } {
    const errors: string[] = [];
    const validRecords: any[] = [];

    if (!data || data.length === 0) {
      errors.push('El archivo está vacío o no contiene datos válidos');
      return { isValid: false, errors, validRecords };
    }

    data.forEach((row, index) => {
      const rowErrors: string[] = [];
      const rowNumber = index + 2; // +2 porque Excel empieza en 1 y la primera fila son headers

      // Validar campos requeridos
      if (!row.SIGLA && !row.sigla) {
        rowErrors.push(`Fila ${rowNumber}: SIGLA es requerida`);
      }

      if (!row.DESCRIPCION && !row.descripcion && !row.DESCRIPCIÓN) {
        rowErrors.push(`Fila ${rowNumber}: DESCRIPCION es requerida`);
      }

      // Validar longitud de campos
      const plan = row.PLAN || row.plan;
      const sigla = row.SIGLA || row.sigla;
      const descripcion = row.DESCRIPCION || row.descripcion || row.DESCRIPCIÓN;

      if (plan && plan.length > 10) {
        rowErrors.push(`Fila ${rowNumber}: PLAN no puede exceder 10 caracteres`);
      }

      if (sigla && sigla.length > 20) {
        rowErrors.push(`Fila ${rowNumber}: SIGLA no puede exceder 20 caracteres`);
      }

      if (descripcion && descripcion.length > 500) {
        rowErrors.push(`Fila ${rowNumber}: DESCRIPCION no puede exceder 500 caracteres`);
      }

      if (rowErrors.length === 0) {
        validRecords.push({
          PLAN: plan || null,
          SIGLA: sigla,
          DESCRIPCION: descripcion,
        });
      } else {
        errors.push(...rowErrors);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      validRecords,
    };
  }

  private async saveDolData(data: any[], bimestreId: number): Promise<StagingDol[]> {
    this.logger.log('=== INICIO SAVE DOL DATA ===');
    this.logger.log(`Datos a guardar: ${data.length} registros`);
    this.logger.log(`BimestreId: ${bimestreId}`);
    this.logger.log('Primeros 2 registros a guardar:', JSON.stringify(data.slice(0, 2), null, 2));
    
    const records: StagingDol[] = [];

    try {
      // Limpiar todos los datos existentes en la tabla staging
      this.logger.log('Eliminando todos los registros existentes de la tabla staging_dol...');
      await this.stagingDolRepository.clear();
      this.logger.log('Tabla staging_dol limpiada completamente');

      this.logger.log('Iniciando inserción de nuevos registros...');
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        this.logger.log(`Procesando registro ${i + 1}/${data.length}:`, JSON.stringify(row));
        
        const record = new StagingDol();
        record.plan = row.PLAN || row.plan || null;
        record.sigla = row.SIGLA || row.sigla;
        record.descripcion = row.DESCRIPCION || row.descripcion;
        record.id_bimestre = bimestreId;
        
        this.logger.log(`Entidad creada:`, {
          plan: record.plan,
          sigla: record.sigla,
          descripcion: record.descripcion,
          id_bimestre: record.id_bimestre
        });
        
        try {
          const savedRecord = await this.stagingDolRepository.save(record);
           this.logger.log(`Registro ${i + 1} guardado exitosamente - SIGLA: ${savedRecord.sigla}, Bimestre: ${savedRecord.id_bimestre}`);
           records.push(savedRecord);
        } catch (saveError) {
          this.logger.error(`Error guardando registro ${i + 1}:`, saveError.message);
          throw saveError;
        }
      }

      this.logger.log(`=== SAVE DOL DATA COMPLETADO ===`);
      this.logger.log(`Total registros guardados: ${records.length}`);
      
      // Verificar que los datos se guardaron
      const countAfter = await this.stagingDolRepository.count({ where: { id_bimestre: bimestreId } });
      this.logger.log(`Verificación: registros en BD para bimestre ${bimestreId}: ${countAfter}`);
      
      return records;
    } catch (error) {
      this.logger.error('=== ERROR EN SAVE DOL DATA ===');
      this.logger.error('Error guardando datos DOL:', error.message);
      this.logger.error('Stack trace:', error.stack);
      throw error;
    }
  }

  async processVacantesInicio(file: Express.Multer.File, options: ProcessOptions, userId?: number): Promise<UploadResult> {
    try {
      this.logger.log('=== INICIO PROCESS VACANTES INICIO SERVICE ===');
      this.logger.log(`Procesando archivo Vacantes Inicio: ${file.originalname}`);
      this.logger.log(`Tamaño buffer: ${file.buffer.length} bytes`);
      this.logger.log(`Opciones recibidas: ${JSON.stringify(options)}`);

      // Read Excel file
      this.logger.log('Leyendo archivo Excel...');
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      this.logger.log(`Hojas encontradas: ${workbook.SheetNames.join(', ')}`);
      
      const sheetName = workbook.SheetNames[0];
      this.logger.log(`Procesando hoja: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      this.logger.log(`Datos leídos del Excel: ${data.length} filas`);
      this.logger.log('Primeras 3 filas de datos:', JSON.stringify(data.slice(0, 3), null, 2));

      // Validate data
      const validation = this.validateVacantesInicioData(data);
      this.logger.log(`Validación completada. Válidos: ${validation.validRecords.length}, Errores: ${validation.errors.length}`);

      if (!validation.isValid) {
        this.logger.warn('Datos inválidos encontrados:', validation.errors);
        
        // Registrar carga con errores
        await this.logUpload(
          file.originalname,
          'Vacantes Inicio',
          options.bimestreId,
          'Con errores',
          data.length,
          data.length - validation.validRecords.length,
          userId,
          validation.errors.join('; ')
        );
        
        return {
          success: false,
          message: 'Errores de validación encontrados',
          errors: validation.errors,
          summary: {
            totalRecords: data.length,
            validRecords: validation.validRecords.length,
            invalidRecords: data.length - validation.validRecords.length,
            errors: validation.errors,
          },
        };
      }

      // Save data if not validation only
      if (!options.validateOnly) {
        this.logger.log('Guardando datos en la base de datos...');
        const savedRecords = await this.saveVacantesInicioData(validation.validRecords, options.bimestreId);
        this.logger.log(`Datos guardados exitosamente: ${savedRecords.length} registros`);
        
        // Registrar carga exitosa
        await this.logUpload(
          file.originalname,
          'Vacantes Inicio',
          options.bimestreId,
          'Exitoso',
          data.length,
          0,
          userId,
          null
        );
      } else {
        // Registrar validación (sin guardar datos)
        await this.logUpload(
          file.originalname,
          'Vacantes Inicio (Validación)',
          options.bimestreId,
          'Exitoso',
          data.length,
          0,
          userId,
          null
        );
      }

      this.logger.log('=== PROCESO VACANTES INICIO COMPLETADO EXITOSAMENTE ===');
      return {
        success: true,
        message: options.validateOnly ? 'Validación completada exitosamente' : 'Vacantes Inicio procesadas exitosamente',
        summary: {
          totalRecords: data.length,
          validRecords: validation.validRecords.length,
          invalidRecords: 0,
          errors: [],
        },
      };
    } catch (error) {
      this.logger.error('=== ERROR EN PROCESS VACANTES INICIO ===');
      this.logger.error('Error procesando archivo Vacantes Inicio:', error.message);
      this.logger.error('Stack trace:', error.stack);
      
      // Registrar error crítico
      await this.logUpload(
        file.originalname,
        'Vacantes Inicio',
        options.bimestreId,
        'Error',
        0,
        0,
        userId, // Usuario que realiza la carga
        error.message
      );
      
      throw error;
    }
  }

  private validateVacantesInicioData(data: any[]): { isValid: boolean; errors: string[]; validRecords: any[] } {
    const errors: string[] = [];
    const validRecords: any[] = [];

    if (!data || data.length === 0) {
      errors.push('El archivo está vacío o no contiene datos válidos');
      return { isValid: false, errors, validRecords };
    }

    data.forEach((row, index) => {
      const rowErrors: string[] = [];
      const rowNumber = index + 2; // +2 porque Excel empieza en 1 y la primera fila son headers

      // Validar campos requeridos
      if (!row['CODIGO PLAN'] && !row['codigo_plan']) {
        rowErrors.push(`Fila ${rowNumber}: CODIGO PLAN es requerido`);
      }
      if (!row['CARREA'] && !row['carrera']) {
        rowErrors.push(`Fila ${rowNumber}: CARRERA es requerida`);
      }
      if (!row['SIGLA ASIGNATURA'] && !row['sigla_asignatura']) {
        rowErrors.push(`Fila ${rowNumber}: SIGLA ASIGNATURA es requerida`);
      }
      if (!row['ASIGNATURA'] && !row['asignatura']) {
        rowErrors.push(`Fila ${rowNumber}: ASIGNATURA es requerida`);
      }
      if (!row['NIVEL'] && !row['nivel']) {
        rowErrors.push(`Fila ${rowNumber}: NIVEL es requerido`);
      }
      if (!row['CREDITOS'] && !row['creditos'] && row['CREDITOS'] !== 0 && row['creditos'] !== 0) {
        rowErrors.push(`Fila ${rowNumber}: CREDITOS es requerido`);
      }
      if (!row['VACANTES'] && !row['vacantes'] && row['VACANTES'] !== 0 && row['vacantes'] !== 0) {
        rowErrors.push(`Fila ${rowNumber}: VACANTES es requerido`);
      }

      // Validar tipos de datos
      const creditos = row['CREDITOS'] || row['creditos'];
      const vacantes = row['VACANTES'] || row['vacantes'];
      
      if (creditos !== undefined && (isNaN(Number(creditos)) || Number(creditos) < 0)) {
        rowErrors.push(`Fila ${rowNumber}: CREDITOS debe ser un número válido mayor o igual a 0`);
      }
      if (vacantes !== undefined && (isNaN(Number(vacantes)) || Number(vacantes) < 0)) {
        rowErrors.push(`Fila ${rowNumber}: VACANTES debe ser un número válido mayor o igual a 0`);
      }

      if (rowErrors.length === 0) {
        validRecords.push({
          codigo_plan: (row['CODIGO PLAN'] || row['codigo_plan'])?.toString().trim(),
          carrera: (row['CARREA'] || row['carrera'])?.toString().trim(),
          sigla_asignatura: (row['SIGLA ASIGNATURA'] || row['sigla_asignatura'])?.toString().trim(),
          asignatura: (row['ASIGNATURA'] || row['asignatura'])?.toString().trim(),
          nivel: (row['NIVEL'] || row['nivel'])?.toString().trim(),
          creditos: Number(creditos),
          vacantes: Number(vacantes),
        });
      } else {
        errors.push(...rowErrors);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      validRecords,
    };
  }

  private async saveVacantesInicioData(data: any[], bimestreId: number): Promise<StagingVacantesInicio[]> {
    this.logger.log('=== INICIO SAVE VACANTES INICIO DATA ===');
    this.logger.log(`Datos a guardar: ${data.length} registros`);
    this.logger.log(`BimestreId: ${bimestreId}`);
    this.logger.log('Primeros 2 registros a guardar:', JSON.stringify(data.slice(0, 2), null, 2));
    
    const records: StagingVacantesInicio[] = [];

    try {
      // Limpiar todos los datos existentes en la tabla staging
      this.logger.log('Eliminando todos los registros existentes de la tabla staging_vacantes_inicio...');
      await this.stagingVacantesInicioRepository.clear();
      this.logger.log('Tabla staging_vacantes_inicio limpiada completamente');

      this.logger.log('Iniciando inserción de nuevos registros...');
      
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        this.logger.log(`Procesando registro ${i + 1}/${data.length}:`, JSON.stringify(item, null, 2));
        
        const record = this.stagingVacantesInicioRepository.create({
          codigo_plan: item.codigo_plan,
          carrera: item.carrera,
          sigla_asignatura: item.sigla_asignatura,
          asignatura: item.asignatura,
          nivel: item.nivel,
          creditos: item.creditos,
          vacantes: item.vacantes,
          id_bimestre: bimestreId,
        });

        this.logger.log(`Registro ${i + 1} creado:`, JSON.stringify(record, null, 2));
        
        try {
          const savedRecord = await this.stagingVacantesInicioRepository.save(record);
          this.logger.log(`Registro ${i + 1} guardado exitosamente - SIGLA: ${savedRecord.sigla_asignatura}, Bimestre: ${savedRecord.id_bimestre}`);
          records.push(savedRecord);
        } catch (saveError) {
          this.logger.error(`Error guardando registro ${i + 1}:`, saveError.message);
          throw saveError;
        }
      }

      this.logger.log(`=== SAVE VACANTES INICIO DATA COMPLETADO ===`);
      this.logger.log(`Total registros guardados: ${records.length}`);
      
      // Verificar que los datos se guardaron
      const countAfter = await this.stagingVacantesInicioRepository.count({ where: { id_bimestre: bimestreId } });
      this.logger.log(`Verificación: registros en BD para bimestre ${bimestreId}: ${countAfter}`);
      
      return records;
    } catch (error) {
      this.logger.error('=== ERROR EN SAVE VACANTES INICIO DATA ===');
      this.logger.error('Error guardando datos Vacantes Inicio:', error.message);
      this.logger.error('Stack trace:', error.stack);
      throw error;
    }
  }

  async processEstructuraAcademica(file: Express.Multer.File, options: ProcessOptions, userId?: number): Promise<UploadResult> {
    try {
      this.logger.log('=== INICIO PROCESS ESTRUCTURA ACADEMICA SERVICE ===');
      this.logger.log(`Procesando archivo Estructura Académica: ${file.originalname}`);
      this.logger.log(`Tamaño buffer: ${file.buffer.length} bytes`);
      this.logger.log(`Opciones recibidas: ${JSON.stringify(options)}`);

      // Read Excel file
      this.logger.log('Leyendo archivo Excel...');
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      this.logger.log(`Hojas encontradas: ${workbook.SheetNames.join(', ')}`);
      
      const sheetName = workbook.SheetNames[0];
      this.logger.log(`Procesando hoja: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      this.logger.log(`Datos leídos del Excel: ${data.length} filas`);
      this.logger.log('Primeras 3 filas de datos:', JSON.stringify(data.slice(0, 3), null, 2));

      if (data.length === 0) {
        throw new Error('El archivo Excel está vacío o no contiene datos válidos');
      }

      // Validate and transform data
      const validatedData = await this.validateEstructuraAcademicaData(data, options.bimestreId);
      this.logger.log(`Datos validados: ${validatedData.length} registros`);

      if (options.validateOnly) {
        this.logger.log('=== MODO VALIDACIÓN ÚNICAMENTE ===');
        
        // Registrar validación (sin guardar datos)
        await this.logUpload(
          file.originalname,
          'Estructura Académica (Validación)',
          options.bimestreId,
          'Exitoso',
          data.length,
          data.length - validatedData.length,
          userId,
          null
        );
        
        return {
          success: true,
          message: 'Validación completada exitosamente',
          summary: {
            totalRecords: data.length,
            validRecords: validatedData.length,
            invalidRecords: data.length - validatedData.length,
          },
        };
      }

      // Clear existing data for this bimestre
      await this.clearEstructuraAcademicaData(options.bimestreId);

      // Save data
      const savedRecords = await this.saveEstructuraAcademicaData(validatedData, options.bimestreId);
      this.logger.log(`Registros guardados: ${savedRecords.length}`);
      
      // Registrar carga exitosa
      await this.logUpload(
        file.originalname,
        'Estructura Académica',
        options.bimestreId,
        'Exitoso',
        data.length,
        data.length - savedRecords.length,
        userId,
        null
      );

      this.logger.log('=== FIN PROCESS ESTRUCTURA ACADEMICA SERVICE ===');
      return {
        success: true,
        message: 'Estructura Académica procesada exitosamente',
        summary: {
          totalRecords: data.length,
          validRecords: savedRecords.length,
          invalidRecords: data.length - savedRecords.length,
        },
      };
    } catch (error) {
      this.logger.error('=== ERROR EN PROCESS ESTRUCTURA ACADEMICA SERVICE ===');
      this.logger.error('Error procesando Estructura Académica:', error.message);
      this.logger.error('Stack trace:', error.stack);
      
      // Registrar error crítico
      await this.logUpload(
        file.originalname,
        'Estructura Académica',
        options.bimestreId,
        'Error',
        0,
        0,
        userId, // Usuario que realiza la carga
        error.message
      );
      
      throw error;
    }
  }

  private async validateEstructuraAcademicaData(data: any[], bimestreId: number): Promise<any[]> {
    this.logger.log('=== INICIO VALIDATE ESTRUCTURA ACADEMICA DATA ===');
    const validatedRecords = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      this.logger.log(`Validando fila ${i + 1}:`, JSON.stringify(row));

      try {
        // Mapear campos con flexibilidad en nombres de columnas
        const mappedRow = this.mapEstructuraAcademicaFields(row);
        
        // Validaciones básicas
        if (!mappedRow.sigla || mappedRow.sigla.trim() === '') {
          throw new Error('Sigla es requerida');
        }

        if (!mappedRow.asignatura || mappedRow.asignatura.trim() === '') {
          throw new Error('Asignatura es requerida');
        }

        // Agregar bimestreId
        mappedRow.id_bimestre = bimestreId;

        validatedRecords.push(mappedRow);
        this.logger.log(`Fila ${i + 1} validada exitosamente`);
      } catch (error) {
        this.logger.error(`Error validando fila ${i + 1}:`, error.message);
        errors.push(`Fila ${i + 1}: ${error.message}`);
      }
    }

    this.logger.log(`=== VALIDATE ESTRUCTURA ACADEMICA DATA COMPLETADO ===`);
    this.logger.log(`Total registros válidos: ${validatedRecords.length}`);
    this.logger.log(`Total errores: ${errors.length}`);

    if (errors.length > 0) {
      this.logger.warn('Errores de validación:', errors);
    }

    return validatedRecords;
  }

  private mapEstructuraAcademicaFields(row: any): any {
    // Log para debug: mostrar las columnas disponibles
    this.logger.log('=== DEBUG MAPEO CAMPOS ===');
    this.logger.log('Columnas disponibles en el Excel:', Object.keys(row));
    this.logger.log('Datos de la fila:', JSON.stringify(row, null, 2));
    
    // Mapear campos con flexibilidad en nombres de columnas
    const fieldMappings = {
      plan: ['plan', 'PLAN', 'Plan'],
      carrera: ['carrera', 'CARRERA', 'Carrera'],
      nivel: ['nivel', 'NIVEL', 'Nivel'],
      sigla: ['sigla', 'SIGLA', 'Sigla'],
      asignatura: ['asignatura', 'ASIGNATURA', 'Asignatura'],
      creditos: ['creditos', 'CREDITOS', 'Creditos', 'créditos', 'CRÉDITOS'],
      categoria: ['categoria', 'CATEGORIA', 'Categoria', 'categoría', 'CATEGORÍA'],
      horas: ['horas', 'HORAS', 'Horas'],
      duracion_carrera: ['duracion_carrera', 'DURACION_CARRERA', 'Duracion_Carrera', 'duración_carrera', 'DURACIÓN CARRERA'],
      clplestud: ['clplestud', 'CLPLESTUD', 'Clplestud', 'ClPlEstud'],
      codigo_escuela: ['codigo_escuela', 'CODIGO_ESCUELA', 'Codigo_Escuela', 'código_escuela', 'CODIGO ESCUELA'],
      escuela_programa: ['escuela_programa', 'ESCUELA_PROGRAMA', 'Escuela_Programa', 'ESCUELA / PROGRAMA']
    };

    const mappedRow: any = {};

    for (const [targetField, possibleNames] of Object.entries(fieldMappings)) {
      for (const name of possibleNames) {
        if (row[name] !== undefined && row[name] !== null) {
          mappedRow[targetField] = row[name];
          this.logger.log(`Campo mapeado: ${targetField} = ${row[name]} (desde columna: ${name})`);
          break;
        }
      }
      if (!mappedRow[targetField]) {
        this.logger.log(`Campo NO mapeado: ${targetField} - columnas buscadas: ${possibleNames.join(', ')}`);
      }
    }

    // Convertir números si es necesario
    if (mappedRow.creditos) {
      mappedRow.creditos = parseInt(mappedRow.creditos) || null;
    }
    if (mappedRow.horas) {
      mappedRow.horas = parseInt(mappedRow.horas) || null;
    }

    this.logger.log('Resultado del mapeo:', JSON.stringify(mappedRow, null, 2));
    this.logger.log('=== FIN DEBUG MAPEO ===');
    
    return mappedRow;
  }

  private async clearEstructuraAcademicaData(bimestreId: number): Promise<void> {
    this.logger.log('=== INICIO CLEAR ESTRUCTURA ACADEMICA DATA ===');
    this.logger.log('Limpiando todos los datos existentes de la tabla staging_estructura_academica...');

    try {
      await this.stagingEstructuraAcademicaRepository.clear();
      this.logger.log('Tabla staging_estructura_academica limpiada completamente');
      this.logger.log('=== CLEAR ESTRUCTURA ACADEMICA DATA COMPLETADO ===');
    } catch (error) {
      this.logger.error('=== ERROR EN CLEAR ESTRUCTURA ACADEMICA DATA ===');
      this.logger.error('Error limpiando datos:', error.message);
      throw error;
    }
  }

  private async saveEstructuraAcademicaData(data: any[], bimestreId: number): Promise<StagingEstructuraAcademica[]> {
    this.logger.log('=== INICIO SAVE ESTRUCTURA ACADEMICA DATA ===');
    this.logger.log(`Guardando ${data.length} registros para bimestre ${bimestreId}`);

    try {
      const records: StagingEstructuraAcademica[] = [];
      
      for (let i = 0; i < data.length; i++) {
        const rowData = data[i];
        this.logger.log(`Guardando registro ${i + 1}/${data.length}:`, JSON.stringify(rowData));

        try {
           const record = this.stagingEstructuraAcademicaRepository.create(rowData);
           const savedRecord = await this.stagingEstructuraAcademicaRepository.save(record);
           this.logger.log(`Registro ${i + 1} guardado exitosamente`);
           records.push(savedRecord as unknown as StagingEstructuraAcademica);
         } catch (saveError) {
          this.logger.error(`Error guardando registro ${i + 1}:`, saveError.message);
          throw saveError;
        }
      }

      this.logger.log(`=== SAVE ESTRUCTURA ACADEMICA DATA COMPLETADO ===`);
      this.logger.log(`Total registros guardados: ${records.length}`);
      
      // Verificar que los datos se guardaron
      const countAfter = await this.stagingEstructuraAcademicaRepository.count({ where: { id_bimestre: bimestreId } });
      this.logger.log(`Verificación: registros en BD para bimestre ${bimestreId}: ${countAfter}`);
      
      return records;
    } catch (error) {
      this.logger.error('=== ERROR EN SAVE ESTRUCTURA ACADEMICA DATA ===');
      this.logger.error('Error guardando datos Estructura Académica:', error.message);
      this.logger.error('Stack trace:', error.stack);
      throw error;
    }
  }

  async getSystemStats(): Promise<any> {
    try {
      const adolCount = await this.stagingAdolRepository.count();
      const dolCount = await this.stagingDolRepository.count();
      const vacantesInicioCount = await this.stagingVacantesInicioRepository.count();
      const estructuraAcademicaCount = await this.stagingEstructuraAcademicaRepository.count();

      return {
        staging_adol_simple: adolCount,
        staging_dol: dolCount,
        staging_vacantes_inicio: vacantesInicioCount,
        academic_structures: estructuraAcademicaCount,
        teachers: 0,
        course_reports: 0,
      };
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }

  async getSystemHealth(): Promise<any> {
    return {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        database: 'connected',
        fileSystem: 'accessible',
      },
    };
  }

  async processReporteCursables(file: Express.Multer.File, options: ProcessOptions, userId?: number): Promise<UploadResult> {
    try {
      this.logger.log('=== INICIO PROCESS REPORTE CURSABLES SERVICE ===');
      this.logger.log(`Procesando archivo Reporte Cursables: ${file.originalname}`);
      this.logger.log(`Tamaño buffer: ${file.buffer.length} bytes`);
      this.logger.log(`Opciones recibidas: ${JSON.stringify(options)}`);

      // Read Excel file
      this.logger.log('Leyendo archivo Excel...');
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      this.logger.log(`Hojas encontradas: ${workbook.SheetNames.join(', ')}`);
      
      const sheetName = workbook.SheetNames[0];
      this.logger.log(`Procesando hoja: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      this.logger.log(`Datos leídos del Excel: ${data.length} filas`);
      this.logger.log('Primeras 3 filas de datos:', JSON.stringify(data.slice(0, 3), null, 2));

      // Validate data
      this.logger.log('Iniciando validación de datos...');
      const validation = this.validateReporteCursablesData(data);
      
      this.logger.log(`Validación completada:`);
      this.logger.log(`- Es válido: ${validation.isValid}`);
      this.logger.log(`- Registros válidos: ${validation.validRecords.length}`);
      this.logger.log(`- Errores: ${validation.errors.length}`);
      
      if (validation.errors.length > 0) {
        this.logger.log('Errores de validación:', JSON.stringify(validation.errors, null, 2));
      }
      
      if (!validation.isValid) {
        this.logger.log('Retornando resultado con errores de validación');
        
        // Registrar carga con errores
        await this.logUpload(
          file.originalname,
          'Reporte Cursables',
          options.bimestreId,
          'Con errores',
          data.length,
          data.length - validation.validRecords.length,
          userId,
          validation.errors.join('; ')
        );
        
        return {
          success: false,
          message: 'Errores de validación encontrados',
          summary: {
            totalRecords: data.length,
            validRecords: validation.validRecords.length,
            invalidRecords: data.length - validation.validRecords.length,
            errors: validation.errors
          }
        };
      }

      // Save data if not validation only
      if (!options.validateOnly) {
        this.logger.log(`Guardando ${validation.validRecords.length} registros válidos en BD...`);
        this.logger.log(`BimestreId para guardar: ${options.bimestreId}`);
        
        const savedRecords = await this.saveReporteCursablesData(validation.validRecords, options.bimestreId);
        
        this.logger.log(`Registros guardados exitosamente: ${savedRecords.length}`);
        
        // Registrar carga exitosa
        await this.logUpload(
          file.originalname,
          'Reporte Cursables',
          options.bimestreId,
          validation.errors.length > 0 ? 'Con errores' : 'Exitoso',
          data.length,
          data.length - savedRecords.length,
          userId,
          validation.errors.length > 0 ? validation.errors.join('; ') : null
        );
        
        const result = {
          success: true,
          message: `Reporte Cursables procesado exitosamente. ${savedRecords.length} registros guardados.`,
          summary: {
            totalRecords: data.length,
            validRecords: savedRecords.length,
            invalidRecords: data.length - savedRecords.length,
            errors: validation.errors
          }
        };
        
        this.logger.log('=== RESULTADO FINAL PROCESS REPORTE CURSABLES ===');
        this.logger.log(JSON.stringify(result, null, 2));
        
        return result;
      } else {
        this.logger.log('Modo validación solamente, no guardando en BD');
        
        // Registrar validación (sin guardar datos)
        await this.logUpload(
          file.originalname,
          'Reporte Cursables (Validación)',
          options.bimestreId,
          validation.errors.length > 0 ? 'Con errores' : 'Exitoso',
          data.length,
          data.length - validation.validRecords.length,
          userId, // Usuario que realiza la carga
          validation.errors.length > 0 ? validation.errors.join('; ') : null
        );
        
        return {
          success: true,
          message: 'Validación completada exitosamente',
          summary: {
            totalRecords: data.length,
            validRecords: validation.validRecords.length,
            invalidRecords: data.length - validation.validRecords.length,
            errors: validation.errors
          }
        };
      }
    } catch (error) {
      this.logger.error('=== ERROR EN PROCESS REPORTE CURSABLES SERVICE ===');
      this.logger.error(`Error procesando archivo Reporte Cursables: ${error.message}`);
      this.logger.error('Stack trace completo:', error.stack);
      
      // Registrar error crítico
      await this.logUpload(
        file.originalname,
        'Reporte Cursables',
        options.bimestreId,
        'Error',
        0,
        0,
        userId, // Usuario que realiza la carga
        error.message
      );
      
      throw new Error(`Error procesando archivo Reporte Cursables: ${error.message}`);
    }
  }

  private validateReporteCursablesData(data: any[]): { isValid: boolean; errors: string[]; validRecords: any[] } {
    const errors: string[] = [];
    const validRecords: any[] = [];

    if (!data || data.length === 0) {
      errors.push('El archivo está vacío o no contiene datos válidos');
      return { isValid: false, errors, validRecords };
    }

    data.forEach((row, index) => {
      const rowErrors: string[] = [];
      const rowNumber = index + 2; // +2 porque Excel empieza en 1 y la primera fila son headers

      // Validar campos requeridos
      if (!row.RUT && !row.rut) {
        rowErrors.push(`Fila ${rowNumber}: RUT es requerido`);
      }

      if (!row.PLAN && !row.plan) {
        rowErrors.push(`Fila ${rowNumber}: PLAN es requerido`);
      }

      if (!row.NIVEL && !row.nivel) {
        rowErrors.push(`Fila ${rowNumber}: NIVEL es requerido`);
      }

      if (!row.SIGLA && !row.sigla) {
        rowErrors.push(`Fila ${rowNumber}: SIGLA es requerida`);
      }

      if (!row.ASIGNATURA && !row.asignatura) {
        rowErrors.push(`Fila ${rowNumber}: ASIGNATURA es requerida`);
      }

      // Validar longitud de campos
      const rut = row.RUT || row.rut;
      const plan = row.PLAN || row.plan;
      const nivel = row.NIVEL || row.nivel;
      const sigla = row.SIGLA || row.sigla;
      const asignatura = row.ASIGNATURA || row.asignatura;

      if (rut && rut.length > 20) {
        rowErrors.push(`Fila ${rowNumber}: RUT no puede exceder 20 caracteres`);
      }

      if (plan && plan.length > 50) {
        rowErrors.push(`Fila ${rowNumber}: PLAN no puede exceder 50 caracteres`);
      }

      if (nivel && nivel.length > 50) {
        rowErrors.push(`Fila ${rowNumber}: NIVEL no puede exceder 50 caracteres`);
      }

      if (sigla && sigla.length > 50) {
        rowErrors.push(`Fila ${rowNumber}: SIGLA no puede exceder 50 caracteres`);
      }

      if (asignatura && asignatura.length > 255) {
        rowErrors.push(`Fila ${rowNumber}: ASIGNATURA no puede exceder 255 caracteres`);
      }

      if (rowErrors.length === 0) {
        validRecords.push({
          rut: rut,
          plan: plan,
          nivel: nivel,
          sigla: sigla,
          asignatura: asignatura,
        });
      } else {
        errors.push(...rowErrors);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      validRecords,
    };
  }

  private async saveReporteCursablesData(data: any[], bimestreId: number): Promise<StagingReporteCursables[]> {
    this.logger.log('=== INICIO SAVE REPORTE CURSABLES DATA ===');
    this.logger.log(`Datos a guardar: ${data.length} registros`);
    this.logger.log(`BimestreId: ${bimestreId}`);
    this.logger.log('Primeros 2 registros a guardar:', JSON.stringify(data.slice(0, 2), null, 2));
    
    const records: StagingReporteCursables[] = [];

    try {
      // Limpiar todos los datos existentes en la tabla staging
      this.logger.log('Eliminando todos los registros existentes de la tabla staging_reporte_cursables...');
      await this.stagingReporteCursablesRepository.clear();
      this.logger.log('Tabla staging_reporte_cursables limpiada completamente');

      this.logger.log('Iniciando inserción de nuevos registros...');
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        this.logger.log(`Procesando registro ${i + 1}/${data.length}:`, JSON.stringify(row));
        
        const record = new StagingReporteCursables();
        record.rut = row.rut;
        record.plan = row.plan;
        record.nivel = row.nivel;
        record.sigla = row.sigla;
        record.asignatura = row.asignatura;
        record.id_bimestre = bimestreId;
        
        this.logger.log(`Entidad creada:`, {
          rut: record.rut,
          plan: record.plan,
          nivel: record.nivel,
          sigla: record.sigla,
          asignatura: record.asignatura,
          id_bimestre: record.id_bimestre
        });
        
        try {
          const savedRecord = await this.stagingReporteCursablesRepository.save(record);
           this.logger.log(`Registro ${i + 1} guardado exitosamente - RUT: ${savedRecord.rut}, SIGLA: ${savedRecord.sigla}, Bimestre: ${savedRecord.id_bimestre}`);
           records.push(savedRecord);
        } catch (saveError) {
          this.logger.error(`Error guardando registro ${i + 1}:`, saveError.message);
          throw saveError;
        }
      }

      this.logger.log(`=== SAVE REPORTE CURSABLES DATA COMPLETADO ===`);
      this.logger.log(`Total registros guardados: ${records.length}`);
      
      // Verificar que los datos se guardaron
      const countAfter = await this.stagingReporteCursablesRepository.count({ where: { id_bimestre: bimestreId } });
      this.logger.log(`Verificación: registros en BD para bimestre ${bimestreId}: ${countAfter}`);
      
      return records;
    } catch (error) {
      this.logger.error('=== ERROR EN SAVE REPORTE CURSABLES DATA ===');
      this.logger.error('Error guardando datos Reporte Cursables:', error.message);
      this.logger.error('Stack trace:', error.stack);
      throw error;
    }
  }

  async processNominaDocentes(file: Express.Multer.File, options: ProcessOptions, userId?: number): Promise<UploadResult> {
    try {
      this.logger.log('=== INICIO PROCESS NOMINA DOCENTES SERVICE ===');
      this.logger.log(`Procesando archivo Nómina Docentes: ${file.originalname}`);
      this.logger.log(`Tamaño buffer: ${file.buffer.length} bytes`);
      this.logger.log(`Opciones recibidas: ${JSON.stringify(options)}`);

      // Read Excel file
      this.logger.log('Leyendo archivo Excel...');
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      this.logger.log(`Hojas encontradas: ${workbook.SheetNames.join(', ')}`);
      
      const sheetName = workbook.SheetNames[0];
      this.logger.log(`Procesando hoja: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      this.logger.log(`Datos leídos del Excel: ${data.length} filas`);
      this.logger.log('Primeras 3 filas de datos:', JSON.stringify(data.slice(0, 3), null, 2));

      if (data.length === 0) {
        this.logger.warn('El archivo no contiene datos');
        
        // Registrar carga con error (archivo vacío)
        await this.logUpload(
          file.originalname,
          'Nómina Docentes',
          options.bimestreId,
          'Error',
          0,
          0,
          userId,
          'El archivo está vacío o no tiene el formato correcto'
        );
        
        return {
          success: false,
          message: 'El archivo no contiene datos válidos',
          errors: ['El archivo está vacío o no tiene el formato correcto']
        };
      }

      // Validate data
      this.logger.log('Iniciando validación de datos...');
      const validation = this.validateNominaDocentesData(data);
      this.logger.log(`Validación completada. Válidos: ${validation.validRecords.length}, Errores: ${validation.errors.length}`);

      if (!validation.isValid) {
        this.logger.error('Errores de validación encontrados:', validation.errors);
        
        // Registrar carga con errores
        await this.logUpload(
          file.originalname,
          'Nómina Docentes',
          options.bimestreId,
          'Con errores',
          data.length,
          data.length - validation.validRecords.length,
          userId, // Usuario que realiza la carga
          validation.errors.join('; ')
        );
        
        return {
          success: false,
          message: 'Errores de validación en los datos',
          errors: validation.errors,
          summary: {
            totalRecords: data.length,
            validRecords: validation.validRecords.length,
            invalidRecords: data.length - validation.validRecords.length,
            errors: validation.errors
          }
        };
      }

      if (options.validateOnly) {
        this.logger.log('Modo validación únicamente - no se guardarán datos');
        
        // Registrar validación (sin guardar datos)
        await this.logUpload(
          file.originalname,
          'Nómina Docentes (Validación)',
          options.bimestreId,
          'Exitoso',
          data.length,
          0,
          userId, // Usuario que realiza la carga
          null
        );
        
        return {
          success: true,
          message: `Validación exitosa. ${validation.validRecords.length} registros válidos encontrados`,
          summary: {
            totalRecords: data.length,
            validRecords: validation.validRecords.length,
            invalidRecords: 0
          }
        };
      }

      // Save data
      this.logger.log('Iniciando guardado de datos...');
      const savedRecords = await this.saveNominaDocentesData(validation.validRecords, options.bimestreId);
      this.logger.log(`Datos guardados exitosamente: ${savedRecords.length} registros`);
      
      // Registrar carga exitosa
      await this.logUpload(
        file.originalname,
        'Nómina Docentes',
        options.bimestreId,
        'Exitoso',
        data.length,
        0,
        userId, // Usuario que realiza la carga
        null
      );

      const result = {
        success: true,
        message: `Nómina de Docentes procesada exitosamente. ${savedRecords.length} registros guardados.`,
        data: {
          processedRecords: savedRecords.length,
          bimestreId: options.bimestreId
        },
        summary: {
          totalRecords: data.length,
          validRecords: validation.validRecords.length,
          invalidRecords: 0
        }
      };

      this.logger.log('=== FIN PROCESS NOMINA DOCENTES SERVICE ===');
      this.logger.log('Resultado final:', JSON.stringify(result, null, 2));
      return result;

    } catch (error) {
      this.logger.error('=== ERROR EN PROCESS NOMINA DOCENTES SERVICE ===');
      this.logger.error('Error procesando Nómina Docentes:', error.message);
      this.logger.error('Stack trace:', error.stack);
      
      // Registrar error crítico
      await this.logUpload(
        file.originalname,
        'Nómina Docentes',
        options.bimestreId,
        'Error',
        0,
        0,
        userId,
        error.message
      );
      
      return {
        success: false,
        message: 'Error interno del servidor al procesar Nómina Docentes',
        errors: [error.message]
      };
    }
  }

  private validateNominaDocentesData(data: any[]): { isValid: boolean; errors: string[]; validRecords: any[] } {
    const errors: string[] = [];
    const validRecords: any[] = [];

    if (!data || data.length === 0) {
      errors.push('El archivo está vacío o no contiene datos válidos');
      return { isValid: false, errors, validRecords };
    }

    // Log para debug: mostrar las columnas disponibles
    this.logger.log('=== DEBUG VALIDACION NOMINA DOCENTES ===');
    this.logger.log('Total de filas a validar:', data.length);
    if (data.length > 0) {
      this.logger.log('Columnas disponibles en el Excel:', Object.keys(data[0]));
      this.logger.log('Primera fila de datos:', JSON.stringify(data[0], null, 2));
    }

    data.forEach((row, index) => {
      const rowErrors: string[] = [];
      const rowNumber = index + 2; // +2 porque Excel empieza en 1 y la primera fila son headers

      // Validar campos requeridos
      if (!row.DOCENTE || row.DOCENTE.toString().trim() === '') {
        rowErrors.push(`Fila ${rowNumber}: El campo DOCENTE es requerido`);
      }

      if (!row['ID DOCENTE'] || row['ID DOCENTE'].toString().trim() === '') {
        rowErrors.push(`Fila ${rowNumber}: El campo ID DOCENTE es requerido`);
      }

      // RUT DOCENTE es opcional, puede ser null
      // if (!row['RUT DOCENTE'] || row['RUT DOCENTE'].toString().trim() === '') {
      //   rowErrors.push(`Fila ${rowNumber}: El campo RUT DOCENTE es requerido`);
      // }

      if (rowErrors.length === 0) {
        validRecords.push({
          docente: row.DOCENTE.toString().trim(),
          id_docente: row['ID DOCENTE'].toString().trim(),
          rut_docente: row['RUT DOCENTE'] && row['RUT DOCENTE'].toString().trim() !== '' ? row['RUT DOCENTE'].toString().trim() : null
        });
      } else {
        errors.push(...rowErrors);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      validRecords
    };
  }

  private async saveNominaDocentesData(data: any[], bimestreId: number): Promise<StagingNominaDocentes[]> {
    this.logger.log('=== INICIO SAVE NOMINA DOCENTES DATA ===');
    this.logger.log(`Datos a guardar: ${data.length} registros`);
    this.logger.log(`BimestreId: ${bimestreId}`);
    this.logger.log('Primeros 2 registros a guardar:', JSON.stringify(data.slice(0, 2), null, 2));
    
    const records: StagingNominaDocentes[] = [];

    try {
      // Limpiar todos los datos existentes en la tabla staging
      this.logger.log('Eliminando todos los registros existentes de la tabla staging_nomina_docentes...');
      await this.stagingNominaDocentesRepository.clear();
      this.logger.log('Tabla staging_nomina_docentes limpiada completamente');

      this.logger.log('Iniciando inserción de nuevos registros...');
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        this.logger.log(`Procesando registro ${i + 1}/${data.length}:`, JSON.stringify(item, null, 2));
        
        const record = this.stagingNominaDocentesRepository.create({
          docente: item.docente,
          id_docente: item.id_docente,
          rut_docente: item.rut_docente,
          id_bimestre: bimestreId
        });
        
        const savedRecord = await this.stagingNominaDocentesRepository.save(record);
        records.push(savedRecord);
        
        if ((i + 1) % 100 === 0) {
          this.logger.log(`Progreso: ${i + 1}/${data.length} registros guardados`);
        }
      }

      this.logger.log(`=== GUARDADO COMPLETADO ===`);
      this.logger.log(`Total de registros guardados: ${records.length}`);
      
      // Verificar que los datos se guardaron correctamente
      const countAfter = await this.stagingNominaDocentesRepository.count({ where: { id_bimestre: bimestreId } });
      this.logger.log(`Verificación: registros en BD para bimestre ${bimestreId}: ${countAfter}`);
      
      return records;
    } catch (error) {
      this.logger.error('=== ERROR EN SAVE NOMINA DOCENTES DATA ===');
      this.logger.error('Error guardando datos Nómina Docentes:', error.message);
      this.logger.error('Stack trace:', error.stack);
      throw error;
    }
  }

  /**
   * Obtiene los detalles de una carga específica para visualización
   */
  async getUploadDetails(uploadId: string): Promise<any> {
    try {
      this.logger.log(`=== OBTENIENDO DETALLES DE CARGA: ${uploadId} ===`);
      
      // Obtener información de la carga desde upload_log
      const uploadLog = await this.uploadLogRepository.findOne({
        where: { id: parseInt(uploadId) },
        relations: ['bimestre']
      });

      if (!uploadLog) {
        throw new Error(`No se encontró la carga con ID: ${uploadId}`);
      }

      this.logger.log(`Tipo de carga encontrado: ${uploadLog.uploadType}`);

      // Obtener datos de la tabla staging correspondiente
      let validRecords = [];
      let invalidRecords = [];

      switch (uploadLog.uploadType) {
        case 'ADOL':
          const adolData = await this.stagingAdolRepository.find();
          validRecords = adolData.map((record, index) => ({
            rowNumber: index + 1,
            data: {
              'SIGLA': record.SIGLA,
              'DESCRIPCION': record.DESCRIPCION,
              'ID_BIMESTRE': record.id_bimestre
            }
          }));
          break;

        case 'DOL':
          const dolData = await this.stagingDolRepository.find();
          validRecords = dolData.map((record, index) => ({
            rowNumber: index + 1,
            data: {
              'PLAN': record.plan,
              'SIGLA': record.sigla,
              'DESCRIPCION': record.descripcion,
              'ID_BIMESTRE': record.id_bimestre
            }
          }));
          break;

        case 'Estructura Académica':
          const estructuraData = await this.stagingEstructuraAcademicaRepository.find();
          validRecords = estructuraData.map((record, index) => ({
            rowNumber: index + 1,
            data: {
              'PLAN': record.plan,
              'CARRERA': record.carrera,
              'NIVEL': record.nivel,
              'SIGLA': record.sigla,
              'ASIGNATURA': record.asignatura
            }
          }));
          break;

        case 'Nómina Docentes':
          const nominaData = await this.stagingNominaDocentesRepository.find();
          validRecords = nominaData.map((record, index) => ({
            rowNumber: index + 1,
            data: {
              'DOCENTE': record.docente,
              'RUT_DOCENTE': record.rut_docente,
              'ID_BIMESTRE': record.id_bimestre
            }
          }));
          break;

        case 'Reporte Cursables':
          const reporteData = await this.stagingReporteCursablesRepository.find();
          validRecords = reporteData.map((record, index) => ({
            rowNumber: index + 1,
            data: {
              'RUT': record.rut,
              'PLAN': record.plan,
              'NIVEL': record.nivel,
              'SIGLA': record.sigla,
              'ASIGNATURA': record.asignatura,
              'ID_BIMESTRE': record.id_bimestre
            }
          }));
          break;

        case 'Vacantes Inicio':
          this.logger.log('=== PROCESANDO VACANTES_INICIO ===');
          this.logger.log(`Buscando datos para bimestre: ${uploadLog.bimestreId}`);
          const vacantesData = await this.stagingVacantesInicioRepository.find({
            where: { id_bimestre: uploadLog.bimestreId }
          });
          this.logger.log(`Registros encontrados en BD: ${vacantesData.length}`);
          if (vacantesData.length > 0) {
            this.logger.log('Primer registro:', JSON.stringify(vacantesData[0], null, 2));
          }
          validRecords = vacantesData.map((record, index) => ({
            rowNumber: index + 1,
            data: {
              'CODIGO_PLAN': record.codigo_plan,
              'CARRERA': record.carrera,
              'SIGLA_ASIGNATURA': record.sigla_asignatura,
              'NIVEL': record.nivel,
              'CREDITOS': record.creditos,
              'VACANTES': record.vacantes
            }
          }));
          this.logger.log(`Registros válidos mapeados: ${validRecords.length}`);
          break;

        default:
          this.logger.warn(`Tipo de carga no soportado: ${uploadLog.uploadType}`);
          break;
      }

      const details = {
        filename: uploadLog.fileName,
        type: this.formatUploadType(uploadLog.uploadType),
        date: uploadLog.uploadDate.toISOString(),
        bimestre: uploadLog.bimestre?.nombre || 'N/A',
        validRecords,
        invalidRecords // Por ahora vacío, se puede implementar lógica de errores más adelante
      };
      
      this.logger.log(`Detalles obtenidos exitosamente. Registros válidos: ${validRecords.length}`);
      return details;
    } catch (error) {
      this.logger.error('=== ERROR AL OBTENER DETALLES DE CARGA ===');
      this.logger.error('Error:', error.message);
      this.logger.error('Stack trace:', error.stack);
      throw error;
    }
  }

  // Nuevos métodos para gestión de cargas
  async getRecentUploads(bimestreId?: number) {
    try {
      this.logger.log('=== OBTENIENDO CARGAS RECIENTES ===');
      if (bimestreId) {
        this.logger.log(`Filtrando por bimestre ID: ${bimestreId}`);
      }
      
      const queryBuilder = this.uploadLogRepository
        .createQueryBuilder('ul')
        .leftJoinAndSelect('ul.bimestre', 'b')
        .leftJoinAndSelect('ul.user', 'u')
        .leftJoinAndSelect('ul.approvedBy', 'approver')
        .select([
          'ul.id',
          'ul.fileName',
          'ul.uploadType',
          'ul.uploadDate',
          'ul.status',
          'ul.approvalStatus',
          'ul.isProcessed',
          'ul.totalRecords',
          'ul.errorCount',
          'ul.errorDetails',
          'b.id',
          'b.nombre',
          'u.id',
          'u.name',
          'approver.id',
          'approver.name'
        ]);

      // Agregar filtro por bimestre si se proporciona
      if (bimestreId) {
        queryBuilder.where('ul.bimestreId = :bimestreId', { bimestreId });
      }

      const recentUploads = await queryBuilder
        .orderBy('ul.uploadDate', 'DESC')
        .limit(50)
        .getMany();

      // Formatear los datos para el frontend
      const formattedUploads = recentUploads.map(upload => ({
        id: upload.id,
        file_name: upload.fileName,
        upload_type: upload.uploadType,
        upload_date: upload.uploadDate.toISOString(),
        bimestre: upload.bimestre?.nombre || 'N/A',
        status: upload.status,
        approval_status: upload.approvalStatus,
        is_processed: upload.isProcessed,
        total_records: upload.totalRecords,
        error_count: upload.errorCount,
        user_name: upload.user?.name || 'Sistema',
        approved_by_name: upload.approvedBy?.name || null,
        approved_at: upload.approvedAt?.toISOString() || null
      }));

      this.logger.log(`Cargas recientes obtenidas: ${formattedUploads.length}`);
      return formattedUploads;
    } catch (error) {
      this.logger.error('Error al obtener cargas recientes:', error.message);
      throw error;
    }
  }

  async getUploadHistory(page: number = 1, limit: number = 20, filters: any = {}) {
    try {
      this.logger.log('=== OBTENIENDO HISTORIAL COMPLETO DE CARGAS ===');
      this.logger.log(`Página: ${page}, Límite: ${limit}, Filtros:`, filters);
      
      const queryBuilder = this.uploadLogRepository
        .createQueryBuilder('ul')
        .leftJoinAndSelect('ul.bimestre', 'b')
        .leftJoinAndSelect('ul.user', 'u')
        .leftJoinAndSelect('ul.approvedBy', 'approver')
        .select([
          'ul.id',
          'ul.fileName',
          'ul.uploadType',
          'ul.uploadDate',
          'ul.status',
          'ul.approvalStatus',
          'ul.isProcessed',
          'ul.totalRecords',
          'ul.errorCount',
          'ul.errorDetails',
          'ul.approvedAt',
          'ul.processedAt',
          'b.id',
          'b.nombre',
          'u.id',
          'u.name',
          'approver.id',
          'approver.name'
        ]);

      // Filtro fijo: solo mostrar registros aprobados
      queryBuilder.where('ul.approvalStatus = :approvalStatus', { approvalStatus: 'Aprobado' });

      // Aplicar filtros adicionales
      if (filters.uploadType) {
        queryBuilder.andWhere('ul.uploadType = :uploadType', { uploadType: filters.uploadType });
      }
      if (filters.status) {
        queryBuilder.andWhere('ul.status = :status', { status: filters.status });
      }
      if (filters.bimestreId) {
        queryBuilder.andWhere('ul.bimestre_id = :bimestreId', { bimestreId: filters.bimestreId });
      }
      if (filters.dateFrom) {
        queryBuilder.andWhere('ul.uploadDate >= :dateFrom', { dateFrom: filters.dateFrom });
      }
      if (filters.dateTo) {
        queryBuilder.andWhere('ul.uploadDate <= :dateTo', { dateTo: filters.dateTo });
      }

      // Obtener total de registros
      const total = await queryBuilder.getCount();

      // Aplicar paginación
      const history = await queryBuilder
        .orderBy('ul.uploadDate', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      // Formatear los datos para el frontend
      const formattedHistory = history.map(upload => ({
        id: upload.id,
        file_name: upload.fileName,
        upload_type: upload.uploadType,
        upload_date: upload.uploadDate.toISOString(),
        bimestre: upload.bimestre?.nombre || 'N/A',
        status: upload.status,
        approval_status: upload.approvalStatus,
        is_processed: upload.isProcessed,
        total_records: upload.totalRecords,
        error_count: upload.errorCount,
        user_name: upload.user?.name || 'Sistema',
        approved_by_name: upload.approvedBy?.name || null,
        approved_at: upload.approvedAt?.toISOString() || null,
        processed_at: upload.processedAt?.toISOString() || null,
        error_details: upload.errorDetails
      }));

      const result = {
        uploads: formattedHistory,
        total,
        page,
        limit
      };

      this.logger.log(`Historial obtenido: ${formattedHistory.length} de ${total} registros`);
      return result;
    } catch (error) {
      this.logger.error('Error al obtener historial de cargas:', error.message);
      throw error;
    }
  }

  async approveUpload(uploadId: number, approvedByUserId: number) {
    try {
      this.logger.log(`=== APROBANDO CARGA ID: ${uploadId} ===`);
      this.logger.log(`Usuario aprobador ID: ${approvedByUserId}`);
      
      const upload = await this.uploadLogRepository.findOne({
        where: { id: uploadId },
        relations: ['bimestre', 'user']
      });

      if (!upload) {
        throw new BadRequestException('Carga no encontrada');
      }

      if (upload.approvalStatus === 'Aprobado') {
        throw new BadRequestException('La carga ya está aprobada');
      }

      if (upload.isProcessed) {
        throw new BadRequestException('La carga ya ha sido procesada');
      }

      // Actualizar el estado de aprobación
      upload.approvalStatus = 'Aprobado';
      upload.approvedByUserId = approvedByUserId;
      upload.approvedAt = new Date();

      await this.uploadLogRepository.save(upload);

      // Si es una carga de Estructura Académica, ejecutar load_plans.js y luego resolve_permissions.js
      if (upload.uploadType === 'Estructura Académica') {
        this.logger.log('=== EJECUTANDO LOAD_PLANS PARA ESTRUCTURA ACADÉMICA ===');
        try {
          const { stdout, stderr } = await execAsync('node scripts/permissions/load_plans.js', {
            cwd: process.cwd().replace('backend', '')
          });
          
          if (stderr) {
            this.logger.warn('Load plans stderr:', stderr);
          }
          
          this.logger.log('Load plans stdout:', stdout);
          this.logger.log('Load plans ejecutado exitosamente después de aprobar Estructura Académica');
          
          // Ejecutar resolve_permissions.js después de load_plans.js
          this.logger.log('=== EJECUTANDO RESOLVE_PERMISSIONS DESPUÉS DE LOAD_PLANS ===');
          try {
            const { stdout: resolveStdout, stderr: resolveStderr } = await execAsync('node scripts/permissions/resolve_permissions.js', {
              cwd: process.cwd().replace('backend', '')
            });
            
            if (resolveStderr) {
              this.logger.warn('Resolve permissions stderr:', resolveStderr);
            }
            
            this.logger.log('Resolve permissions stdout:', resolveStdout);
            this.logger.log('Resolve permissions ejecutado exitosamente después de load_plans');
            
            // Migrar datos de staging_estructura_academica a academic_structures
            try {
              this.logger.log('Iniciando migración de datos de staging_estructura_academica a academic_structures...');
              await this.migrateAcademicStructures();
              this.logger.log('Migración de datos completada exitosamente');
            } catch (migrationError) {
              this.logger.error('Error durante la migración de datos:', migrationError.message);
              // No lanzamos el error para no interrumpir la aprobación
            }
          } catch (resolvePermissionsError) {
            this.logger.error('Error ejecutando resolve_permissions:', resolvePermissionsError.message);
            if (resolvePermissionsError.stdout) {
              this.logger.error('Resolve permissions stdout:', resolvePermissionsError.stdout);
            }
            if (resolvePermissionsError.stderr) {
              this.logger.error('Resolve permissions stderr:', resolvePermissionsError.stderr);
            }
            // No lanzamos el error para no interrumpir la aprobación
            // pero registramos el problema
          }
          
          // Marcar como procesado
          upload.isProcessed = true;
          upload.processedAt = new Date();
          await this.uploadLogRepository.save(upload);
        } catch (loadPlansError) {
          this.logger.error('Error ejecutando load_plans:', loadPlansError.message);
          if (loadPlansError.stdout) {
            this.logger.error('Load plans stdout:', loadPlansError.stdout);
          }
          if (loadPlansError.stderr) {
            this.logger.error('Load plans stderr:', loadPlansError.stderr);
          }
          // No lanzamos el error para no interrumpir la aprobación
          // pero registramos el problema
        }
      }
      
      // Si es una carga de Nómina de Docentes, ejecutar el SP de migración
      if (upload.uploadType === 'Nómina Docentes') {
        this.logger.log('=== EJECUTANDO MIGRACIÓN PARA NÓMINA DE DOCENTES ===');
        try {
          // Migrar datos de staging_nomina_docentes a teachers
          this.logger.log('Iniciando migración de datos de staging_nomina_docentes a teachers...');
          await this.migrateNominaDocentes();
          this.logger.log('Migración de nómina de docentes completada exitosamente');
          
          // Marcar como procesado
          upload.isProcessed = true;
          upload.processedAt = new Date();
          await this.uploadLogRepository.save(upload);
        } catch (migrationError) {
          this.logger.error('Error durante la migración de nómina de docentes:', migrationError.message);
          // No lanzamos el error para no interrumpir la aprobación
          // pero registramos el problema
        }
      }
      
      // Si es una carga de Vacantes Inicio, ejecutar el SP de migración
      if (upload.uploadType === 'Vacantes Inicio') {
        this.logger.log('=== EJECUTANDO MIGRACIÓN PARA VACANTES INICIO ===');
        try {
          // Obtener el email del usuario aprobador
          const approverUser = await this.dataSource.query(
            'SELECT email_institucional FROM users WHERE id = ?',
            [approvedByUserId]
          );
          
          const approverEmail = approverUser.length > 0 ? approverUser[0].email_institucional : null;
          this.logger.log(`Usuario aprobador: ${approverEmail || 'SISTEMA'}`);
          
          // Migrar datos de staging_vacantes_inicio a vacantes_inicio_permanente
          this.logger.log('Iniciando migración de datos de staging_vacantes_inicio a vacantes_inicio_permanente...');
          await this.migrateVacantesInicio(approverEmail);
          this.logger.log('Migración de vacantes inicio completada exitosamente');
          
          // Marcar como procesado
          upload.isProcessed = true;
          upload.processedAt = new Date();
          await this.uploadLogRepository.save(upload);
        } catch (migrationError) {
          this.logger.error('Error durante la migración de vacantes inicio:', migrationError.message);
          // No lanzamos el error para no interrumpir la aprobación
          // pero registramos el problema
        }
      }
      
      // Si es una carga de Reporte Cursables, ejecutar el SP de migración
      if (upload.uploadType === 'Reporte Cursables') {
        this.logger.log('=== EJECUTANDO MIGRACIÓN PARA REPORTE CURSABLES ===');
        try {
          // Obtener el email del usuario aprobador
          const approverUser = await this.dataSource.query(
            'SELECT email_institucional FROM users WHERE id = ?',
            [approvedByUserId]
          );
          
          const approverEmail = approverUser.length > 0 ? approverUser[0].email_institucional : null;
          this.logger.log(`Usuario aprobador: ${approverEmail || 'SISTEMA'}`);
          
          // Migrar datos de staging_reporte_cursables a reporte_cursables_aprobados
          this.logger.log('Iniciando migración de datos de staging_reporte_cursables a reporte_cursables_aprobados...');
          await this.migrateReporteCursables(approverEmail);
          this.logger.log('Migración de reporte cursables completada exitosamente');
          
          // Marcar como procesado
          upload.isProcessed = true;
          upload.processedAt = new Date();
          await this.uploadLogRepository.save(upload);
        } catch (migrationError) {
          this.logger.error('Error durante la migración de reporte cursables:', migrationError.message);
          // No lanzamos el error para no interrumpir la aprobación
          // pero registramos el problema
        }
      }

      this.logger.log('Carga aprobada exitosamente');
      return {
        id: upload.id,
        fileName: upload.fileName,
        uploadType: upload.uploadType,
        approvalStatus: upload.approvalStatus,
        approvedAt: upload.approvedAt
      };
    } catch (error) {
      this.logger.error('Error al aprobar carga:', error.message);
      throw error;
    }
  }

  async rejectUpload(uploadId: number, rejectedByUserId: number, reason?: string) {
    try {
      this.logger.log(`=== RECHAZANDO CARGA ID: ${uploadId} ===`);
      this.logger.log(`Usuario que rechaza ID: ${rejectedByUserId}`);
      this.logger.log(`Razón: ${reason || 'No especificada'}`);
      
      const upload = await this.uploadLogRepository.findOne({
        where: { id: uploadId },
        relations: ['bimestre', 'user']
      });

      if (!upload) {
        throw new BadRequestException('Carga no encontrada');
      }

      if (upload.approvalStatus === 'Rechazado') {
        throw new BadRequestException('La carga ya está rechazada');
      }

      if (upload.isProcessed) {
        throw new BadRequestException('La carga ya ha sido procesada');
      }

      // Actualizar el estado de aprobación
      upload.approvalStatus = 'Rechazado';
      upload.approvedByUserId = rejectedByUserId;
      upload.approvedAt = new Date();
      
      // Agregar la razón del rechazo a los detalles de errores
      const rejectionReason = `Rechazado por usuario ID ${rejectedByUserId}: ${reason || 'Sin razón especificada'}`;
      upload.errorDetails = upload.errorDetails 
        ? `${upload.errorDetails}\n\n${rejectionReason}`
        : rejectionReason;

      await this.uploadLogRepository.save(upload);

      this.logger.log('Carga rechazada exitosamente');
      return {
        id: upload.id,
        fileName: upload.fileName,
        uploadType: upload.uploadType,
        approvalStatus: upload.approvalStatus,
        approvedAt: upload.approvedAt,
        rejectionReason: reason
      };
    } catch (error) {
      this.logger.error('Error al rechazar carga:', error.message);
      throw error;
    }
  }

  /**
   * Migra datos de staging_estructura_academica a academic_structures
   */
  private async migrateAcademicStructures(): Promise<void> {
    try {
      this.logger.log('=== INICIANDO MIGRACIÓN DE ACADEMIC STRUCTURES CON SP ===');
      
      // Verificar conteo actual en staging_estructura_academica
      const stagingCount = await this.stagingEstructuraAcademicaRepository.count();
      this.logger.log(`Registros en staging_estructura_academica: ${stagingCount}`);
      
      if (stagingCount === 0) {
        this.logger.log('No hay registros en staging_estructura_academica para migrar');
        return;
      }

      // Verificar conteo actual en academic_structures antes de la migración
      const currentCount = await this.academicStructureRepository.count();
      this.logger.log(`Registros actuales en academic_structures antes de migración: ${currentCount}`);

      // Ejecutar el procedimiento almacenado sp_MigrateStagingToAcademicStructures
      this.logger.log('Ejecutando procedimiento almacenado sp_MigrateStagingToAcademicStructures...');
      await this.dataSource.query('CALL sp_MigrateStagingToAcademicStructures()');
      this.logger.log('Procedimiento almacenado ejecutado exitosamente');
      
      // Verificar conteo final
      const finalCount = await this.academicStructureRepository.count();
      this.logger.log(`Conteo final en academic_structures: ${finalCount}`);
      
      const migratedRecords = finalCount - currentCount;
      this.logger.log(`=== MIGRACIÓN COMPLETADA: ${migratedRecords} registros procesados ===`);
    } catch (error) {
      this.logger.error('Error durante la migración de academic structures:', error.message);
      this.logger.error('Stack trace:', error.stack);
      throw error;
    }
  }

  /**
   * Migra datos de staging_nomina_docentes a teachers
   */
  private async migrateNominaDocentes(): Promise<void> {
    try {
      this.logger.log('=== INICIANDO MIGRACIÓN DE NÓMINA DOCENTES CON SP ===');
      
      // Verificar conteo actual en staging_nomina_docentes
      const stagingCount = await this.stagingNominaDocentesRepository.count();
      this.logger.log(`Registros en staging_nomina_docentes: ${stagingCount}`);
      
      if (stagingCount === 0) {
        this.logger.log('No hay registros en staging_nomina_docentes para migrar');
        return;
      }

      // Verificar conteo actual en teachers antes de la migración
      const currentCount = await this.dataSource.query('SELECT COUNT(*) as count FROM teachers');
      const currentTeachersCount = currentCount[0].count;
      this.logger.log(`Registros actuales en teachers antes de migración: ${currentTeachersCount}`);

      // Ejecutar el procedimiento almacenado sp_migrate_staging_nomina_docentes_to_teachers
      this.logger.log('Ejecutando procedimiento almacenado sp_migrate_staging_nomina_docentes_to_teachers...');
      await this.dataSource.query('CALL sp_migrate_staging_nomina_docentes_to_teachers()');
      this.logger.log('Procedimiento almacenado ejecutado exitosamente');
      
      // Verificar conteo final
      const finalCount = await this.dataSource.query('SELECT COUNT(*) as count FROM teachers');
      const finalTeachersCount = finalCount[0].count;
      this.logger.log(`Conteo final en teachers: ${finalTeachersCount}`);
      
      const processedRecords = finalTeachersCount - currentTeachersCount;
      this.logger.log(`=== MIGRACIÓN COMPLETADA: ${processedRecords} registros procesados ===`);
    } catch (error) {
      this.logger.error('Error durante la migración de nómina docentes:', error.message);
      this.logger.error('Stack trace:', error.stack);
      throw error;
    }
  }

  /**
   * Migra datos de staging_vacantes_inicio a vacantes_inicio_permanente
   */
  private async migrateVacantesInicio(approverEmail: string): Promise<void> {
    try {
      this.logger.log('=== INICIANDO MIGRACIÓN DE VACANTES INICIO CON SP ===');
      
      // Verificar conteo actual en staging_vacantes_inicio
      const stagingCount = await this.stagingVacantesInicioRepository.count();
      this.logger.log(`Registros en staging_vacantes_inicio: ${stagingCount}`);
      
      if (stagingCount === 0) {
        this.logger.log('No hay registros en staging_vacantes_inicio para migrar');
        return;
      }

      // Verificar conteo actual en vacantes_inicio_permanente antes de la migración
      const currentCount = await this.dataSource.query('SELECT COUNT(*) as count FROM vacantes_inicio_permanente');
      const currentVacantesCount = currentCount[0].count;
      this.logger.log(`Registros actuales en vacantes_inicio_permanente antes de migración: ${currentVacantesCount}`);

      // Ejecutar el procedimiento almacenado sp_migrate_staging_vacantes_inicio_to_permanente
      this.logger.log('Ejecutando procedimiento almacenado sp_migrate_staging_vacantes_inicio_to_permanente...');
      await this.dataSource.query(
        'CALL sp_migrate_staging_vacantes_inicio_to_permanente(?)',
        [approverEmail]
      );
      this.logger.log('Procedimiento almacenado ejecutado exitosamente');
      
      // Verificar conteo final
      const finalCount = await this.dataSource.query('SELECT COUNT(*) as count FROM vacantes_inicio_permanente');
      const finalVacantesCount = finalCount[0].count;
      this.logger.log(`Conteo final en vacantes_inicio_permanente: ${finalVacantesCount}`);
      
      const processedRecords = finalVacantesCount - currentVacantesCount;
      this.logger.log(`=== MIGRACIÓN COMPLETADA: ${processedRecords} registros procesados ===`);
    } catch (error) {
      this.logger.error('Error durante la migración de vacantes inicio:', error.message);
      this.logger.error('Stack trace:', error.stack);
      throw error;
    }
  }

  /**
   * Migra datos de staging_reporte_cursables a reporte_cursables_aprobados
   */
  private async migrateReporteCursables(approverEmail: string): Promise<void> {
    try {
      this.logger.log('=== INICIANDO MIGRACIÓN DE REPORTE CURSABLES CON SP ===');
      
      // Verificar conteo actual en staging_reporte_cursables
      const stagingCount = await this.stagingReporteCursablesRepository.count();
      this.logger.log(`Registros en staging_reporte_cursables: ${stagingCount}`);
      
      if (stagingCount === 0) {
        this.logger.log('No hay registros en staging_reporte_cursables para migrar');
        return;
      }

      // Verificar conteo actual en reporte_cursables_aprobados antes de la migración
      const currentCount = await this.dataSource.query('SELECT COUNT(*) as count FROM reporte_cursables_aprobados');
      const currentReporteCount = currentCount[0].count;
      this.logger.log(`Registros actuales en reporte_cursables_aprobados antes de migración: ${currentReporteCount}`);

      // Ejecutar el procedimiento almacenado sp_migrate_staging_reporte_cursables_to_permanente
      this.logger.log('Ejecutando procedimiento almacenado sp_migrate_staging_reporte_cursables_to_permanente...');
      await this.dataSource.query(
        'CALL sp_migrate_staging_reporte_cursables_to_permanente(?)',
        [approverEmail]
      );
      this.logger.log('Procedimiento almacenado ejecutado exitosamente');
      
      // Verificar conteo final
      const finalCount = await this.dataSource.query('SELECT COUNT(*) as count FROM reporte_cursables_aprobados');
      const finalReporteCount = finalCount[0].count;
      this.logger.log(`Conteo final en reporte_cursables_aprobados: ${finalReporteCount}`);
      
      const processedRecords = finalReporteCount - currentReporteCount;
      this.logger.log(`=== MIGRACIÓN COMPLETADA: ${processedRecords} registros procesados ===`);
    } catch (error) {
      this.logger.error('Error durante la migración de reporte cursables:', error.message);
      this.logger.error('Stack trace:', error.stack);
      throw error;
    }
  }

  private formatUploadType(uploadType: string): string {
    const typeMap = {
      'ESTRUCTURA_ACADEMICA': 'Estructura Académica',
      'NOMINA_DOCENTES': 'Nómina de Docentes',
      'REPORTE_CURSABLES': 'Reporte de Cursables',
      'ADOL': 'ADOL',
      'DOL': 'DOL',
      'VACANTES_INICIO': 'Vacantes de Inicio',
      'PAYMENT_CODES': 'Códigos de Pago'
    };
    
    return typeMap[uploadType] || uploadType;
  }

}