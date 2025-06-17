import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { BulkUploadOptions, UploadResultDto, OperationMode } from './dto/file-upload.dto';

/**
 * Servicio de Cargas Masivas
 * 
 * Maneja el procesamiento de archivos Excel para carga masiva de datos.
 * Incluye validación de estructura, parseo de datos, transformación
 * y llamadas a stored procedures.
 * 
 * Características:
 * - Validación de estructura de archivos Excel
 * - Transformación de datos flexible (español/inglés)
 * - Integración con stored procedures
 * - Manejo robusto de errores
 * - Logging detallado de operaciones
 */
@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  // Definición de estructuras requeridas para cada tipo de archivo
  private readonly requiredFields = {
    'academic-structures': ['code', 'name', 'type'],
    'teachers': ['rut', 'name', 'email'],
    'payment-codes': ['code', 'name', 'category', 'type'], // Actualizados para SP
    'course-reports': ['academic_structure_id', 'term', 'year', 'student_count']
  };

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}
  /**
   * Procesa archivo de estructuras académicas
   * 
   * @param file Archivo Excel subido
   * @param options Opciones de procesamiento
   * @returns Resultado del procesamiento
   */
  async processAcademicStructureFile(
    file: Express.Multer.File,
    options: BulkUploadOptions = {}
  ): Promise<UploadResultDto> {
    const startTime = Date.now();
    const fileType = 'academic-structures';
    
    try {
      this.logger.log(`Iniciando procesamiento de ${fileType}: ${file.originalname}`);
      
      // Validar y parsear el archivo Excel
      const data = this.parseExcelFile(file);
      this.logger.log(`Archivo parseado exitosamente: ${data.length} filas encontradas`);
      
      // Validar estructura del archivo
      this.validateFileStructure(data, fileType);
      this.logger.log(`Estructura del archivo validada para ${fileType}`);
      
      // Mapear datos a formato esperado por el SP
      const jsonData = this.mapAcademicStructureData(data);
      this.logger.log(`Datos mapeados: ${jsonData.length} registros preparados`);
        // Validar datos específicos del dominio
      this.validateAcademicStructureData(jsonData);
      
      // *** LOGGING TEMPORAL PARA DEBUG ***
      this.logger.log(`=== DEBUG: Datos antes de SP ===`);
      this.logger.log(`Cantidad de registros a enviar al SP: ${jsonData.length}`);
      this.logger.log(`Primeros 2 registros: ${JSON.stringify(jsonData.slice(0, 2))}`);
      
      // Llamar al SP
      const result = await this.callStoredProcedure(
        'sp_LoadAcademicStructure',
        JSON.stringify(jsonData),
        options.userId || 1,
        options.mode || OperationMode.UPSERT
      );      // *** LOGGING TEMPORAL PARA DEBUG ***
      this.logger.log(`=== DEBUG: Resultado del SP ===`);
      this.logger.log(`Resultado completo: ${JSON.stringify(result)}`);
      this.logger.log(`result.statistics: ${JSON.stringify(result.statistics)}`);
      this.logger.log(`result.success: ${result.success}`);
      this.logger.log(`typeof result: ${typeof result}`);
      this.logger.log(`result keys: ${Object.keys(result || {})}`);

      // Limpiar archivo temporal
      this.cleanupFile(file.path);

      const executionTime = Date.now() - startTime;
      
      // Extraer estadísticas del resultado del SP (corregir mapeo)
      const stats = result.statistics || {};
      this.logger.log(`=== DEBUG: Stats extraídos ===`);
      this.logger.log(`stats: ${JSON.stringify(stats)}`);
      
      const totalRecords = stats.total_rows || jsonData.length;
      const processedRecords = stats.success_count || 0;
      const insertedCount = stats.insert_count || 0;
      const updatedCount = stats.update_count || 0;
      const errorCount = stats.error_count || 0;

      this.logger.log(`=== DEBUG: Valores finales ===`);
      this.logger.log(`totalRecords: ${totalRecords}`);
      this.logger.log(`processedRecords: ${processedRecords}`);
      this.logger.log(`insertedCount: ${insertedCount}`);

      this.logger.log(`Procesamiento completado en ${executionTime}ms: ${processedRecords}/${totalRecords} registros procesados`);

      return {
        success: result.success || true,
        message: result.message || 'Estructuras académicas procesadas exitosamente',
        totalRecords: totalRecords,
        processedRecords: processedRecords,
        insertedCount: insertedCount,
        updatedCount: updatedCount,
        errorCount: errorCount,
        errors: result.errors || [],
        executionTimeMs: executionTime,
        filename: file.originalname,
        uploadedAt: new Date()
      };

    } catch (error) {
      this.logger.error(`Error procesando ${fileType}: ${error.message}`, error.stack);
      this.cleanupFile(file.path);
      throw new BadRequestException(`Error procesando archivo de estructuras académicas: ${error.message}`);
    }
  }
  /**
   * Procesa archivo de docentes
   * 
   * @param file Archivo Excel subido
   * @param options Opciones de procesamiento
   * @returns Resultado del procesamiento
   */
  async processTeachersFile(
    file: Express.Multer.File,
    options: BulkUploadOptions = {}
  ): Promise<UploadResultDto> {
    const startTime = Date.now();
    const fileType = 'teachers';
    
    try {
      this.logger.log(`Iniciando procesamiento de ${fileType}: ${file.originalname}`);
      
      const data = this.parseExcelFile(file);
      this.logger.log(`Archivo parseado exitosamente: ${data.length} filas encontradas`);
      
      this.validateFileStructure(data, fileType);
      this.logger.log(`Estructura del archivo validada para ${fileType}`);
      
      const jsonData = this.mapTeachersData(data);
      this.logger.log(`Datos mapeados: ${jsonData.length} registros preparados`);
      
      this.validateTeachersData(jsonData);
      
      const result = await this.callStoredProcedure(
        'sp_LoadTeachers',
        JSON.stringify(jsonData),
        options.userId || 1,
        options.mode || OperationMode.UPSERT
      );

      this.cleanupFile(file.path);

      const executionTime = Date.now() - startTime;
      this.logger.log(`Procesamiento completado en ${executionTime}ms: ${result.processed_records || jsonData.length} registros`);      // Extraer estadísticas del resultado del SP (pueden estar anidadas en 'statistics')
      const stats = result.statistics || result;

      return {
        success: result.success || true,
        message: result.message || 'Docentes procesados exitosamente',
        totalRecords: stats.total_rows || result.total_records || jsonData.length,
        processedRecords: stats.success_count || result.processed_records || jsonData.length,
        insertedCount: stats.insert_count || result.inserted_count || 0,
        updatedCount: stats.update_count || result.updated_count || 0,
        errorCount: stats.error_count || result.error_count || 0,
        errors: result.errors || [],
        executionTimeMs: executionTime,
        filename: file.originalname,
        uploadedAt: new Date()
      };

    } catch (error) {
      this.logger.error(`Error procesando ${fileType}: ${error.message}`, error.stack);
      this.cleanupFile(file.path);
      throw new BadRequestException(`Error procesando archivo de docentes: ${error.message}`);
    }
  }
  /**
   * Procesa archivo de códigos de pago
   * 
   * @param file Archivo Excel subido
   * @param options Opciones de procesamiento
   * @returns Resultado del procesamiento
   */
  async processPaymentCodesFile(
    file: Express.Multer.File,
    options: BulkUploadOptions = {}
  ): Promise<UploadResultDto> {
    const startTime = Date.now();
    const fileType = 'payment-codes';
    
    try {
      this.logger.log(`Iniciando procesamiento de ${fileType}: ${file.originalname}`);
      
      const data = this.parseExcelFile(file);
      this.logger.log(`Archivo parseado exitosamente: ${data.length} filas encontradas`);
      
      this.validateFileStructure(data, fileType);
      this.logger.log(`Estructura del archivo validada para ${fileType}`);
      
      const jsonData = this.mapPaymentCodesData(data);
      this.logger.log(`Datos mapeados: ${jsonData.length} registros preparados`);
      
      const result = await this.callStoredProcedure(
        'sp_LoadPaymentCodes',
        JSON.stringify(jsonData),
        options.userId || 1,
        options.mode || OperationMode.UPSERT
      );

      this.cleanupFile(file.path);

      const executionTime = Date.now() - startTime;
      this.logger.log(`Procesamiento completado en ${executionTime}ms: ${result.processed_records || jsonData.length} registros`);      // Extraer estadísticas del resultado del SP (pueden estar anidadas en 'statistics')
      const stats = result.statistics || result;

      // Procesar errores - pueden venir como string JSON del SP
      let processedErrors = [];
      if (result.errors) {
        if (typeof result.errors === 'string') {
          try {
            processedErrors = JSON.parse(result.errors);
          } catch (e) {
            this.logger.warn(`Error parsing errors JSON: ${e.message}`);
            processedErrors = [{ message: result.errors }];
          }
        } else if (Array.isArray(result.errors)) {
          processedErrors = result.errors;
        }
      }

      return {
        success: result.success || true,
        message: result.message || 'Códigos de pago procesados exitosamente',
        totalRecords: stats.total_rows || result.total_records || jsonData.length,
        processedRecords: stats.success_count || result.processed_records || jsonData.length,
        insertedCount: stats.insert_count || result.inserted_count || 0,
        updatedCount: stats.update_count || result.updated_count || 0,
        errorCount: stats.error_count || result.error_count || 0,
        errors: processedErrors,
        executionTimeMs: executionTime,
        filename: file.originalname,
        uploadedAt: new Date()
      };

    } catch (error) {
      this.logger.error(`Error procesando ${fileType}: ${error.message}`, error.stack);
      this.cleanupFile(file.path);
      throw new BadRequestException(`Error procesando archivo de códigos de pago: ${error.message}`);
    }
  }

  /**
   * Procesa archivo de reportes de cursables
   * 
   * @param file Archivo Excel subido
   * @param options Opciones de procesamiento
   * @returns Resultado del procesamiento
   */
  async processCourseReportsFile(
    file: Express.Multer.File,
    options: BulkUploadOptions = {}
  ): Promise<UploadResultDto> {
    const startTime = Date.now();
    const fileType = 'course-reports';
    
    try {
      this.logger.log(`Iniciando procesamiento de ${fileType}: ${file.originalname}`);
      
      const data = this.parseExcelFile(file);
      this.logger.log(`Archivo parseado exitosamente: ${data.length} filas encontradas`);
      
      this.validateFileStructure(data, fileType);
      this.logger.log(`Estructura del archivo validada para ${fileType}`);
      
      const jsonData = this.mapCourseReportsData(data);
      this.logger.log(`Datos mapeados: ${jsonData.length} registros preparados`);
      
      const result = await this.callStoredProcedure(
        'sp_LoadCourseReportsData',
        JSON.stringify(jsonData),
        options.userId || 1,
        options.mode || OperationMode.UPSERT
      );

      this.cleanupFile(file.path);

      const executionTime = Date.now() - startTime;
      this.logger.log(`Procesamiento completado en ${executionTime}ms: ${result.processed_records || jsonData.length} registros`);      // Extraer estadísticas del resultado del SP (pueden estar anidadas en 'statistics')
      const stats = result.statistics || result;
      
      return {
        success: result.success || true,
        message: result.message || 'Reportes de cursables procesados exitosamente',
        totalRecords: stats.total_rows || result.total_records || jsonData.length,
        processedRecords: stats.success_count || result.processed_records || jsonData.length,
        insertedCount: stats.insert_count || result.inserted_count || 0,
        updatedCount: stats.update_count || result.updated_count || 0,
        errorCount: stats.error_count || result.error_count || 0,
        errors: result.errors || [],
        executionTimeMs: executionTime,
        filename: file.originalname,
        uploadedAt: new Date()
      };

    } catch (error) {
      this.logger.error(`Error procesando ${fileType}: ${error.message}`, error.stack);
      this.cleanupFile(file.path);
      throw new BadRequestException(`Error procesando archivo de reportes de cursables: ${error.message}`);
    }
  }

  /**
   * Valida un archivo sin procesarlo
   * 
   * @param file Archivo Excel subido
   * @param fileType Tipo de archivo a validar
   * @returns Resultado de la validación
   */
  async validateFile(
    file: Express.Multer.File,
    fileType: string
  ): Promise<UploadResultDto> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Iniciando validación de ${fileType}: ${file.originalname}`);
      
      // Validar y parsear el archivo Excel
      const data = this.parseExcelFile(file);
      this.logger.log(`Archivo parseado exitosamente: ${data.length} filas encontradas`);
      
      // Validar estructura del archivo
      this.validateFileStructure(data, fileType);
      this.logger.log(`Estructura del archivo validada para ${fileType}`);
      
      // Mapear y validar datos según el tipo
      let jsonData: any[];
      
      switch (fileType) {
        case 'academic-structures':
          jsonData = this.mapAcademicStructureData(data);
          this.validateAcademicStructureData(jsonData);
          break;
        case 'teachers':
          jsonData = this.mapTeachersData(data);
          this.validateTeachersData(jsonData);
          break;
        case 'payment-codes':
          jsonData = this.mapPaymentCodesData(data);
          break;
        case 'course-reports':
          jsonData = this.mapCourseReportsData(data);
          break;
        default:
          throw new Error(`Tipo de archivo no soportado: ${fileType}`);
      }

      // Limpiar archivo temporal
      this.cleanupFile(file.path);

      const executionTime = Date.now() - startTime;
      this.logger.log(`Validación completada en ${executionTime}ms: ${jsonData.length} registros válidos`);

      return {
        success: true,
        message: `Archivo ${fileType} validado exitosamente`,
        totalRecords: jsonData.length,
        processedRecords: 0, // No se procesó, solo se validó
        insertedCount: 0,
        updatedCount: 0,
        errorCount: 0,
        errors: [],
        executionTimeMs: executionTime,
        filename: file.originalname,
        uploadedAt: new Date()
      };

    } catch (error) {
      this.logger.error(`Error validando ${fileType}: ${error.message}`, error.stack);
      this.cleanupFile(file.path);
      throw new BadRequestException(`Error validando archivo de ${fileType}: ${error.message}`);
    }
  }
  /**
   * Parsea archivo Excel y convierte a JSON
   * 
   * @param file Archivo Excel a parsear
   * @returns Array de objetos con los datos
   */
  private parseExcelFile(file: Express.Multer.File): any[] {
    try {
      this.logger.log(`Parseando archivo Excel: ${file.originalname} (${file.size} bytes)`);
      
      if (!fs.existsSync(file.path)) {
        throw new Error('Archivo no encontrado en el sistema de archivos');
      }

      const workbook = XLSX.readFile(file.path);
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('El archivo Excel no contiene hojas de cálculo');
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      this.logger.log(`Procesando hoja: ${sheetName}`);
      
      // Convertir a JSON con headers como claves
      const data = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: null,
        blankrows: false // Omitir filas completamente vacías
      });

      if (!data || data.length < 2) {
        throw new Error('El archivo Excel debe contener al menos una fila de encabezados y una fila de datos');
      }

      // Primera fila como headers
      const headers = data[0] as string[];
      const rows = data.slice(1);

      // Validar que hay headers
      if (!headers || headers.length === 0) {
        throw new Error('No se encontraron encabezados en el archivo');
      }

      // Filtrar headers vacíos o undefined
      const validHeaders = headers.filter(header => 
        header !== null && header !== undefined && header.toString().trim() !== ''
      );

      if (validHeaders.length === 0) {
        throw new Error('No se encontraron encabezados válidos en el archivo');
      }

      this.logger.log(`Headers encontrados: ${validHeaders.join(', ')}`);      // Convertir a objetos
      const result = rows
        .filter(row => row && Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && cell.toString().trim() !== '')) // Filtrar filas vacías
        .map((row, index) => {
          const obj = {};
          headers.forEach((header, headerIndex) => {
            if (header && header.toString().trim()) {
              const cleanHeader = header.toString().trim().toLowerCase().replace(/\s+/g, '_');
              obj[cleanHeader] = row[headerIndex];
            }
          });
          return obj;
        });

      this.logger.log(`Parseado exitoso: ${result.length} filas de datos válidas`);
      return result;

    } catch (error) {
      this.logger.error(`Error leyendo archivo Excel: ${error.message}`, error.stack);
      throw new Error(`Error leyendo archivo Excel: ${error.message}`);
    }
  }
  private mapAcademicStructureData(data: any[]): any[] {
    return data.map(row => {
      // Campos requeridos siempre se incluyen
      const mappedRow: any = {
        code: row.codigo || row.code || null,
        name: row.nombre || row.name || null,
        type: row.tipo || row.type || null
      };

      // Campos opcionales: solo se incluyen si tienen valor real (no null/undefined/empty)
      const optionalFields = {
        credits: row.creditos || row.credits,
        plan_code: row.codigo_plan || row.plan_code,
        semester: row.semestre || row.semester,
        prerequisites: row.prerequisitos || row.prerequisites,
        description: row.descripcion || row.description,
        hours_per_week: row.horas_semanales || row.hours_per_week
      };

      // Solo agregar campos opcionales si tienen valor
      Object.keys(optionalFields).forEach(key => {
        const value = optionalFields[key];
        if (value !== null && value !== undefined && value !== '') {
          mappedRow[key] = value;
        }
      });

      // is_active siempre se incluye con valor por defecto
      mappedRow.is_active = row.activo || row.is_active || true;

      return mappedRow;
    });
  }

  private mapTeachersData(data: any[]): any[] {
    return data.map(row => ({
      rut: row.rut || null,
      name: row.nombre || row.name || null,
      email: row.email || row.correo || null,
      phone: row.telefono || row.phone || null,
      address: row.direccion || row.address || null,
      category_code: row.codigo_categoria || row.category_code || null,
      contract_type_code: row.codigo_contrato || row.contract_type_code || null,
      contract_hours: row.horas_contrato || row.contract_hours || null,
      max_hours_per_week: row.max_horas_semana || row.max_hours_per_week || null,
      hire_date: row.fecha_contratacion || row.hire_date || null,
      is_active: row.activo || row.is_active || true
    }));
  }
  private mapPaymentCodesData(data: any[]): any[] {
    return data.map(row => ({
      code_name: row.codigo || row.code || row.code_name || null,
      description: row.nombre || row.name || row.description || null,
      factor: row.factor || row.multiplicador || 1.0, // Factor requerido por el SP
      base_amount: row.base_amount || row.monto_base || 0,
      category: row.categoria || row.category || null,
      type: row.tipo || row.type || row.tipo_contrato || row.contract_type || null,
      is_active: row.activo || row.is_active || true,
      requires_hours: row.requires_hours || row.requiere_horas || false,
      is_taxable: row.is_taxable || row.afecto_impuesto || true,
      valid_from: row.valido_desde || row.valid_from || null,
      valid_until: row.valido_hasta || row.valid_until || null
    }));
  }

  private mapCourseReportsData(data: any[]): any[] {
    return data.map(row => ({
      academic_structure_id: row.id_estructura || row.academic_structure_id || null,
      student_count: row.estudiantes_cursables || row.student_count || null,
      term: row.periodo || row.term || null,
      year: row.ano || row.year || null,
      section: row.seccion || row.section || null,
      modality: row.modalidad || row.modality || null,
      enrolled_count: row.matriculados || row.enrolled_count || null,
      passed_count: row.aprobados || row.passed_count || null,
      failed_count: row.reprobados || row.failed_count || null,
      withdrawn_count: row.retirados || row.withdrawn_count || null,
      weekly_hours: row.horas_semanales || row.weekly_hours || null,
      total_hours: row.horas_totales || row.total_hours || null,
      is_validated: row.validado || row.is_validated || false,
      notes: row.observaciones || row.notes || null
    }));
  }  /**
   * Llama a un stored procedure con manejo robusto de errores
   * 
   * @param spName Nombre del stored procedure
   * @param jsonData Datos JSON a procesar
   * @param userId ID del usuario que ejecuta la operación
   * @param mode Modo de operación (INSERT_ONLY, UPDATE_ONLY, UPSERT)
   * @returns Resultado del stored procedure
   */
  private async callStoredProcedure(
    spName: string, 
    jsonData: string, 
    userId: number, 
    mode: string
  ): Promise<any> {
    try {
      this.logger.log(`Ejecutando SP: ${spName} con ${JSON.parse(jsonData).length} registros en modo ${mode}`);
      
      // Verificar conexión a la base de datos
      if (!this.dataSource.isInitialized) {
        throw new Error('Conexión a la base de datos no inicializada');
      }

      // Para MySQL con parámetros OUT, necesitamos usar una variable de sesión
      await this.dataSource.query(`SET @result = ''`);
      
      // Llamar al SP con la variable de sesión
      const startTime = Date.now();
      await this.dataSource.query(
        `CALL ${spName}(?, ?, ?, @result)`,
        [jsonData, userId, mode]
      );
      
      const spExecutionTime = Date.now() - startTime;
      this.logger.log(`SP ${spName} ejecutado en ${spExecutionTime}ms`);

      // Obtener el resultado de la variable de sesión
      const resultQuery = await this.dataSource.query(`SELECT @result as result`);
      const spResult = resultQuery[0]?.result;
      
      if (spResult && spResult !== '') {
        try {
          const parsedResult = JSON.parse(spResult);
          this.logger.log(`SP ${spName} resultado: ${JSON.stringify(parsedResult)}`);
          return parsedResult;
        } catch (parseError) {
          this.logger.warn(`Error parsing SP result, returning raw result: ${spResult}`);
          return { success: true, message: spResult };
        }
      }

      this.logger.log(`SP ${spName} completado sin resultado explícito`);
      return { success: true, message: 'Procesado exitosamente' };

    } catch (error) {
      this.logger.error(`Error ejecutando SP ${spName}: ${error.message}`, error.stack);
      
      // Verificar si es un error de MySQL específico
      if (error.code) {
        switch (error.code) {
          case 'ER_NO_SUCH_TABLE':
            throw new InternalServerErrorException(`Tabla no encontrada en stored procedure ${spName}`);
          case 'ER_DUP_ENTRY':
            throw new BadRequestException('Error de duplicación: Ya existe un registro con los mismos datos únicos');
          case 'ER_BAD_FIELD_ERROR':
            throw new BadRequestException(`Error en campos: ${error.message}`);
          case 'ER_DATA_TOO_LONG':
            throw new BadRequestException('Error de datos: Uno o más campos exceden la longitud permitida');
          default:
            throw new InternalServerErrorException(`Error de base de datos en ${spName}: ${error.message}`);
        }
      }
      
      throw new InternalServerErrorException(`Error ejecutando stored procedure ${spName}: ${error.message}`);
    }
  }
  /**
   * Limpia archivos temporales con logging
   * 
   * @param filePath Ruta del archivo a eliminar
   */
  private cleanupFile(filePath: string): void {
    try {
      if (!filePath) {
        this.logger.warn('Intento de limpiar archivo con ruta vacía');
        return;
      }

      if (fs.existsSync(filePath)) {
        const fileStat = fs.statSync(filePath);
        fs.unlinkSync(filePath);
        this.logger.log(`Archivo temporal eliminado: ${filePath} (${fileStat.size} bytes)`);
      } else {
        this.logger.warn(`Archivo temporal no encontrado para eliminar: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`No se pudo eliminar archivo temporal: ${filePath}`, error.message);
    }
  }

  /**
   * Valida la estructura básica del archivo Excel
   * 
   * @param data Datos parseados del Excel
   * @param fileType Tipo de archivo a validar
   */
  private validateFileStructure(data: any[], fileType: string): void {
    if (!data || data.length === 0) {
      throw new Error('El archivo está vacío o no contiene datos válidos');
    }

    const requiredFields = this.requiredFields[fileType];
    if (!requiredFields) {
      throw new Error(`Tipo de archivo no soportado: ${fileType}`);
    }

    // Verificar que al menos el primer registro tenga las claves requeridas
    const firstRecord = data[0];
    const availableFields = Object.keys(firstRecord).map(key => key.toLowerCase());
    
    const missingFields = requiredFields.filter(field => {
      const fieldVariations = this.getFieldVariations(field);
      return !fieldVariations.some(variation => 
        availableFields.includes(variation.toLowerCase())
      );
    });

    if (missingFields.length > 0) {
      throw new Error(
        `Campos requeridos faltantes para ${fileType}: ${missingFields.join(', ')}. ` +
        `Campos disponibles: ${availableFields.join(', ')}`
      );
    }
  }

  /**
   * Obtiene variaciones posibles de nombres de campos (español/inglés)
   * 
   * @param field Campo base
   * @returns Array de variaciones posibles
   */
  private getFieldVariations(field: string): string[] {
    const variations = {
      'code': ['code', 'codigo', 'código'],
      'name': ['name', 'nombre'],
      'type': ['type', 'tipo'],
      'rut': ['rut'],
      'email': ['email', 'correo', 'e-mail'],
      'category': ['category', 'categoria', 'categoría'],
      'academic_structure_id': ['academic_structure_id', 'id_estructura', 'estructura_id'],
      'term': ['term', 'periodo', 'período'],
      'year': ['year', 'ano', 'año'],
      'student_count': ['student_count', 'estudiantes', 'estudiantes_cursables']
    };

    return variations[field] || [field];
  }

  /**
   * Valida datos específicos de estructuras académicas
   * 
   * @param data Datos mapeados
   */
  private validateAcademicStructureData(data: any[]): void {
    const errors: string[] = [];

    data.forEach((record, index) => {
      const rowNum = index + 2; // +2 porque es base 1 y saltamos header

      // Validar código (requerido)
      if (!record.code || record.code.toString().trim() === '') {
        errors.push(`Fila ${rowNum}: Código es requerido`);
      }

      // Validar nombre (requerido)
      if (!record.name || record.name.toString().trim() === '') {
        errors.push(`Fila ${rowNum}: Nombre es requerido`);
      }

      // Validar tipo (requerido)
      if (!record.type || record.type.toString().trim() === '') {
        errors.push(`Fila ${rowNum}: Tipo es requerido`);
      }

      // Validar créditos (si está presente, debe ser número positivo)
      if (record.credits !== null && record.credits !== undefined) {
        const credits = Number(record.credits);
        if (isNaN(credits) || credits < 0) {
          errors.push(`Fila ${rowNum}: Créditos debe ser un número positivo`);
        }
      }

      // Validar semestre (si está presente, debe ser número entre 1 y 12)
      if (record.semester !== null && record.semester !== undefined) {
        const semester = Number(record.semester);
        if (isNaN(semester) || semester < 1 || semester > 12) {
          errors.push(`Fila ${rowNum}: Semestre debe ser un número entre 1 y 12`);
        }
      }
    });

    if (errors.length > 0) {
      throw new Error(`Errores de validación encontrados:\n${errors.join('\n')}`);
    }
  }

  /**
   * Valida datos específicos de docentes
   * 
   * @param data Datos mapeados
   */
  private validateTeachersData(data: any[]): void {
    const errors: string[] = [];

    data.forEach((record, index) => {
      const rowNum = index + 2;

      // Validar RUT (requerido y formato chileno)
      if (!record.rut || record.rut.toString().trim() === '') {
        errors.push(`Fila ${rowNum}: RUT es requerido`);
      } else if (!this.validateChileanRUT(record.rut.toString())) {
        errors.push(`Fila ${rowNum}: RUT tiene formato inválido`);
      }

      // Validar nombre (requerido)
      if (!record.name || record.name.toString().trim() === '') {
        errors.push(`Fila ${rowNum}: Nombre es requerido`);
      }

      // Validar email (requerido y formato válido)
      if (!record.email || record.email.toString().trim() === '') {
        errors.push(`Fila ${rowNum}: Email es requerido`);
      } else if (!this.validateEmail(record.email.toString())) {
        errors.push(`Fila ${rowNum}: Email tiene formato inválido`);
      }

      // Validar horas de contrato (si está presente, debe ser positivo)
      if (record.contract_hours !== null && record.contract_hours !== undefined) {
        const hours = Number(record.contract_hours);
        if (isNaN(hours) || hours < 0 || hours > 44) {
          errors.push(`Fila ${rowNum}: Horas de contrato debe ser entre 0 y 44`);
        }
      }
    });

    if (errors.length > 0) {
      throw new Error(`Errores de validación encontrados:\n${errors.join('\n')}`);
    }
  }

  /**
   * Valida formato de RUT chileno
   * 
   * @param rut RUT a validar
   * @returns true si es válido
   */
  private validateChileanRUT(rut: string): boolean {
    // Remover puntos y guiones
    const cleanRUT = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
    
    // Verificar longitud (entre 8 y 9 caracteres)
    if (cleanRUT.length < 8 || cleanRUT.length > 9) {
      return false;
    }

    // Separar número y dígito verificador
    const rutNumber = cleanRUT.slice(0, -1);
    const checkDigit = cleanRUT.slice(-1);

    // Verificar que el número sea numérico
    if (!/^\d+$/.test(rutNumber)) {
      return false;
    }

    // Calcular dígito verificador
    let sum = 0;
    let multiplier = 2;

    for (let i = rutNumber.length - 1; i >= 0; i--) {
      sum += parseInt(rutNumber[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const calculatedCheckDigit = 11 - (sum % 11);
    const finalCheckDigit = calculatedCheckDigit === 11 ? '0' : 
                           calculatedCheckDigit === 10 ? 'K' : calculatedCheckDigit.toString();

    return checkDigit === finalCheckDigit;
  }

  /**
   * Valida formato de email
   * 
   * @param email Email a validar
   * @returns true si es válido
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Obtiene información sobre las plantillas disponibles
   * 
   * @param type Tipo específico de plantilla (opcional)
   * @returns Información de plantillas
   */
  getTemplateInfo(type?: string): any {
    const templates = {
      'academic-structures': {
        description: 'Plantilla para carga de estructura académica',
        requiredFields: this.requiredFields['academic-structures'],
        optionalFields: ['credits', 'plan_code', 'semester', 'prerequisites', 'description', 'hours_per_week', 'is_active'],
        fieldDescriptions: {
          code: 'Código único de la estructura académica',
          name: 'Nombre de la materia/módulo/plan',
          type: 'Tipo (PLAN, MATERIA, MODULO)',
          credits: 'Número de créditos (opcional)',
          plan_code: 'Código del plan al que pertenece (opcional)',
          semester: 'Semestre (1-12, opcional)',
          prerequisites: 'Prerrequisitos (opcional)',
          description: 'Descripción (opcional)',
          hours_per_week: 'Horas semanales (opcional)',
          is_active: 'Activo (true/false, opcional)'
        },
        exampleData: [
          {
            code: 'MAT101',
            name: 'Matemáticas I',
            type: 'MATERIA',
            credits: 6,
            plan_code: 'ING001',
            semester: 1
          }
        ]
      },
      'teachers': {
        description: 'Plantilla para carga de docentes',
        requiredFields: this.requiredFields['teachers'],
        optionalFields: ['phone', 'address', 'category_code', 'contract_type_code', 'contract_hours', 'max_hours_per_week', 'hire_date', 'is_active'],
        fieldDescriptions: {
          rut: 'RUT chileno con formato XX.XXX.XXX-X',
          name: 'Nombre completo del docente',
          email: 'Correo electrónico único',
          phone: 'Teléfono (opcional)',
          address: 'Dirección (opcional)',
          category_code: 'Código de categoría académica (opcional)',
          contract_type_code: 'Código de tipo de contrato (opcional)',
          contract_hours: 'Horas contratadas (0-44, opcional)',
          max_hours_per_week: 'Máximo horas por semana (opcional)',
          hire_date: 'Fecha de contratación (opcional)',
          is_active: 'Activo (true/false, opcional)'
        },
        exampleData: [
          {
            rut: '12.345.678-9',
            name: 'Juan Pérez García',
            email: 'juan.perez@universidad.cl',
            phone: '+56912345678',
            contract_hours: 40
          }
        ]
      },      'payment-codes': {
        description: 'Plantilla para carga de códigos de pago',
        requiredFields: this.requiredFields['payment-codes'],
        optionalFields: ['factor', 'base_amount', 'type', 'is_active', 'requires_hours', 'is_taxable', 'valid_from', 'valid_until'],
        fieldDescriptions: {
          code: 'Código único del tipo de pago',
          name: 'Nombre descriptivo del código',
          category: 'Categoría (docente, administrativo, etc.)',
          type: 'Tipo de código (categoria, bono, etc.)',
          factor: 'Factor multiplicador (decimal)',
          base_amount: 'Monto base (número)',
          is_active: 'Activo (true/false)',
          requires_hours: 'Requiere horas (true/false)',
          is_taxable: 'Afecto a impuestos (true/false)',
          valid_from: 'Válido desde (fecha YYYY-MM-DD)',
          valid_until: 'Válido hasta (fecha YYYY-MM-DD)'
        },
        exampleData: [
          {
            code: 'DOC001',
            name: 'Docencia Pregrado',
            category: 'docente',
            type: 'categoria',
            factor: 1.0,
            base_amount: 50000,
            is_active: true,
            requires_hours: false,
            is_taxable: true,
            valid_from: '2025-01-01',
            valid_until: '2025-12-31'
          }
        ]
      },
      'course-reports': {
        description: 'Plantilla para carga de reportes de cursables',
        requiredFields: this.requiredFields['course-reports'],
        optionalFields: ['section', 'modality', 'enrolled_count', 'passed_count', 'failed_count', 'withdrawn_count', 'weekly_hours', 'total_hours', 'is_validated', 'notes'],
        fieldDescriptions: {
          academic_structure_id: 'ID de la estructura académica',
          term: 'Período académico (1, 2, etc.)',
          year: 'Año académico',
          student_count: 'Número de estudiantes cursables',
          section: 'Sección (opcional)',
          modality: 'Modalidad (Presencial, Online, etc., opcional)',
          enrolled_count: 'Estudiantes matriculados (opcional)',
          passed_count: 'Estudiantes aprobados (opcional)',
          failed_count: 'Estudiantes reprobados (opcional)',
          withdrawn_count: 'Estudiantes retirados (opcional)',
          weekly_hours: 'Horas semanales (opcional)',
          total_hours: 'Horas totales (opcional)',
          is_validated: 'Validado (true/false, opcional)',
          notes: 'Observaciones (opcional)'
        },
        exampleData: [
          {
            academic_structure_id: 1,
            term: 1,
            year: 2024,
            student_count: 150,
            enrolled_count: 150,
            passed_count: 120
          }
        ]
      }
    };

    if (type) {
      return templates[type] || null;
    }

    return {
      availableTemplates: Object.keys(templates),
      templates
    };
  }

  /**
   * Obtener plantillas disponibles (para endpoint del controlador)
   */
  async getAvailableTemplates() {
    return this.getTemplateInfo();
  }
  /**
   * Generar plantilla Excel para descarga
   */
  async generateTemplate(templateType: string): Promise<Buffer> {
    const templates = this.getTemplateInfo(templateType);
    
    if (!templates) {
      throw new Error(`Tipo de plantilla no válido: ${templateType}`);
    }

    // Crear libro de trabajo
    const workbook = XLSX.utils.book_new();
    
    // Obtener datos de ejemplo
    const exampleData = templates.exampleData || [];
    
    // Crear hoja de trabajo
    const worksheet = XLSX.utils.json_to_sheet(exampleData);
    
    // Agregar hoja al libro
    const sheetName = this.getSheetName(templateType);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    return buffer;
  }

  /**
   * Obtener nombre de hoja apropiado para cada tipo
   */
  private getSheetName(templateType: string): string {
    const sheetNames = {
      'academic-structures': 'Estructuras Académicas',
      'teachers': 'Docentes',
      'payment-codes': 'Códigos de Pago',
      'course-reports': 'Reportes de Cursables'
    };
    
    return sheetNames[templateType] || 'Datos';
  }
}
