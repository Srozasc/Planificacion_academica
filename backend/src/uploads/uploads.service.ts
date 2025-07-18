import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { StagingAdolSimple } from '../adol/entities/adol-position.entity';
import { StagingDol } from '../dol/entities/dol-position.entity';
import { ResponseService } from '../common/services/response.service';
import { unlinkSync } from 'fs';

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
  totalPaymentCodes: number;
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
    private responseService: ResponseService,
  ) {}



  async processDol(file: Express.Multer.File, options: ProcessOptions): Promise<UploadResult> {
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
      throw new Error(`Error procesando archivo DOL: ${error.message}`);
    }
  }

  async processAdol(file: Express.Multer.File, options: ProcessOptions): Promise<UploadResult> {
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
      // Limpiar datos existentes para este bimestre
      this.logger.log(`Eliminando registros existentes para bimestre ${bimestreId}...`);
      const deleteResult = await this.stagingAdolRepository.delete({ id_bimestre: bimestreId });
      this.logger.log(`Registros eliminados: ${deleteResult.affected || 0}`);

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
      // Limpiar datos existentes para este bimestre
      this.logger.log(`Eliminando registros existentes para bimestre ${bimestreId}...`);
      const deleteResult = await this.stagingDolRepository.delete({ id_bimestre: bimestreId });
      this.logger.log(`Registros eliminados: ${deleteResult.affected || 0}`);

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

  async getSystemStats(): Promise<any> {
    try {
      const adolCount = await this.stagingAdolRepository.count();
      const dolCount = await this.stagingDolRepository.count();

      return {
        staging_adol_simple: adolCount,
        staging_dol: dolCount,
        academic_structures: 0,
        teachers: 0,
        payment_codes: 0,
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

  async cleanupFiles(type?: string): Promise<any> {
    // Implementar lógica de limpieza de archivos temporales
    return {
      message: 'Limpieza completada',
      filesRemoved: 0,
    };
  }
}