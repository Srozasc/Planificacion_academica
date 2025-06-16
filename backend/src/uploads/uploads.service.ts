import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { BulkUploadOptions, UploadResultDto, OperationMode } from './dto/file-upload.dto';

@Injectable()
export class UploadsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async processAcademicStructureFile(
    file: Express.Multer.File,
    options: BulkUploadOptions = {}
  ): Promise<UploadResultDto> {
    const startTime = Date.now();
    
    try {
      // Leer y parsear el archivo Excel
      const data = this.parseExcelFile(file);
      
      // Mapear datos a formato esperado por el SP
      const jsonData = this.mapAcademicStructureData(data);
      
      // Llamar al SP
      const result = await this.callStoredProcedure(
        'sp_LoadAcademicStructure',
        JSON.stringify(jsonData),
        options.userId || 1,
        options.mode || OperationMode.UPSERT
      );

      // Limpiar archivo temporal
      this.cleanupFile(file.path);

      return {
        success: result.success || true,
        message: result.message || 'Estructuras académicas procesadas exitosamente',
        totalRecords: result.total_records || jsonData.length,
        processedRecords: result.processed_records || jsonData.length,
        insertedCount: result.inserted_count || 0,
        updatedCount: result.updated_count || 0,
        errorCount: result.error_count || 0,
        errors: result.errors || [],
        executionTimeMs: Date.now() - startTime,
        filename: file.originalname,
        uploadedAt: new Date()
      };

    } catch (error) {
      this.cleanupFile(file.path);
      throw new BadRequestException(`Error procesando archivo de estructuras académicas: ${error.message}`);
    }
  }

  async processTeachersFile(
    file: Express.Multer.File,
    options: BulkUploadOptions = {}
  ): Promise<UploadResultDto> {
    const startTime = Date.now();
    
    try {
      const data = this.parseExcelFile(file);
      const jsonData = this.mapTeachersData(data);
      
      const result = await this.callStoredProcedure(
        'sp_LoadTeachers',
        JSON.stringify(jsonData),
        options.userId || 1,
        options.mode || OperationMode.UPSERT
      );

      this.cleanupFile(file.path);

      return {
        success: result.success || true,
        message: result.message || 'Docentes procesados exitosamente',
        totalRecords: result.total_records || jsonData.length,
        processedRecords: result.processed_records || jsonData.length,
        insertedCount: result.inserted_count || 0,
        updatedCount: result.updated_count || 0,
        errorCount: result.error_count || 0,
        errors: result.errors || [],
        executionTimeMs: Date.now() - startTime,
        filename: file.originalname,
        uploadedAt: new Date()
      };

    } catch (error) {
      this.cleanupFile(file.path);
      throw new BadRequestException(`Error procesando archivo de docentes: ${error.message}`);
    }
  }

  async processPaymentCodesFile(
    file: Express.Multer.File,
    options: BulkUploadOptions = {}
  ): Promise<UploadResultDto> {
    const startTime = Date.now();
    
    try {
      const data = this.parseExcelFile(file);
      const jsonData = this.mapPaymentCodesData(data);
      
      const result = await this.callStoredProcedure(
        'sp_LoadPaymentCodes',
        JSON.stringify(jsonData),
        options.userId || 1,
        options.mode || OperationMode.UPSERT
      );

      this.cleanupFile(file.path);

      return {
        success: result.success || true,
        message: result.message || 'Códigos de pago procesados exitosamente',
        totalRecords: result.total_records || jsonData.length,
        processedRecords: result.processed_records || jsonData.length,
        insertedCount: result.inserted_count || 0,
        updatedCount: result.updated_count || 0,
        errorCount: result.error_count || 0,
        errors: result.errors || [],
        executionTimeMs: Date.now() - startTime,
        filename: file.originalname,
        uploadedAt: new Date()
      };

    } catch (error) {
      this.cleanupFile(file.path);
      throw new BadRequestException(`Error procesando archivo de códigos de pago: ${error.message}`);
    }
  }

  async processCourseReportsFile(
    file: Express.Multer.File,
    options: BulkUploadOptions = {}
  ): Promise<UploadResultDto> {
    const startTime = Date.now();
    
    try {
      const data = this.parseExcelFile(file);
      const jsonData = this.mapCourseReportsData(data);
      
      const result = await this.callStoredProcedure(
        'sp_LoadCourseReportsData',
        JSON.stringify(jsonData),
        options.userId || 1,
        options.mode || OperationMode.UPSERT
      );

      this.cleanupFile(file.path);

      return {
        success: result.success || true,
        message: result.message || 'Reportes de cursables procesados exitosamente',
        totalRecords: result.total_records || jsonData.length,
        processedRecords: result.processed_records || jsonData.length,
        insertedCount: result.inserted_count || 0,
        updatedCount: result.updated_count || 0,
        errorCount: result.error_count || 0,
        errors: result.errors || [],
        executionTimeMs: Date.now() - startTime,
        filename: file.originalname,
        uploadedAt: new Date()
      };

    } catch (error) {
      this.cleanupFile(file.path);
      throw new BadRequestException(`Error procesando archivo de reportes de cursables: ${error.message}`);
    }
  }

  private parseExcelFile(file: Express.Multer.File): any[] {
    try {
      const workbook = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir a JSON con headers como claves
      const data = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: null 
      });

      if (!data || data.length < 2) {
        throw new Error('El archivo Excel debe contener al menos una fila de encabezados y una fila de datos');
      }

      // Primera fila como headers
      const headers = data[0] as string[];
      const rows = data.slice(1);

      // Convertir a objetos
      return rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          if (header && header.trim()) {
            obj[header.trim().toLowerCase().replace(/\s+/g, '_')] = row[index];
          }
        });
        return obj;
      });

    } catch (error) {
      throw new Error(`Error leyendo archivo Excel: ${error.message}`);
    }
  }

  private mapAcademicStructureData(data: any[]): any[] {
    return data.map(row => ({
      code: row.codigo || row.code || null,
      name: row.nombre || row.name || null,
      credits: row.creditos || row.credits || null,
      plan_code: row.codigo_plan || row.plan_code || null,
      type: row.tipo || row.type || null,
      semester: row.semestre || row.semester || null,
      prerequisites: row.prerequisitos || row.prerequisites || null,
      description: row.descripcion || row.description || null,
      hours_per_week: row.horas_semanales || row.hours_per_week || null,
      is_active: row.activo || row.is_active || true
    }));
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
      code: row.codigo || row.code || null,
      name: row.nombre || row.name || null,
      category: row.categoria || row.category || null,
      contract_type: row.tipo_contrato || row.contract_type || null,
      hourly_rate: row.valor_hora || row.hourly_rate || null,
      min_hours: row.horas_minimas || row.min_hours || null,
      max_hours: row.horas_maximas || row.max_hours || null,
      valid_from: row.valido_desde || row.valid_from || null,
      valid_until: row.valido_hasta || row.valid_until || null,
      description: row.descripcion || row.description || null,
      is_active: row.activo || row.is_active || true
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
  }
  private async callStoredProcedure(
    spName: string, 
    jsonData: string, 
    userId: number, 
    mode: string
  ): Promise<any> {
    try {
      // Para MySQL con parámetros OUT, necesitamos usar una variable de sesión
      await this.dataSource.query(`SET @result = ''`);
      
      // Llamar al SP con la variable de sesión
      await this.dataSource.query(
        `CALL ${spName}(?, ?, ?, @result)`,
        [jsonData, userId, mode]
      );

      // Obtener el resultado de la variable de sesión
      const resultQuery = await this.dataSource.query(`SELECT @result as result`);
      const spResult = resultQuery[0]?.result;
      
      if (spResult && spResult !== '') {
        try {
          return JSON.parse(spResult);
        } catch (parseError) {
          console.warn('Error parsing SP result, returning raw result:', spResult);
          return { success: true, message: spResult };
        }
      }

      return { success: true, message: 'Procesado exitosamente' };

    } catch (error) {
      throw new InternalServerErrorException(`Error ejecutando stored procedure ${spName}: ${error.message}`);
    }
  }

  private cleanupFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn(`No se pudo eliminar archivo temporal: ${filePath}`, error);
    }
  }
}
