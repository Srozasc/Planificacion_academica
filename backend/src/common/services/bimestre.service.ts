import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, LessThan, MoreThan } from 'typeorm';
import { Bimestre } from '../entities/bimestre.entity';
import * as XLSX from 'xlsx';

export interface CreateBimestreDto {
  nombre: string;
  fechaInicio: string; // Cambiado a string para manejar conversión manual
  fechaFin: string;    // Cambiado a string para manejar conversión manual
  activo?: boolean;
  fechaPago1Inicio?: string;
  fechaPago1Fin?: string;
  fechaPago2Inicio?: string;
  fechaPago2Fin?: string;
  anoAcademico: number;
  numeroBimestre: number;
  descripcion?: string;
  factor?: number;
}

export interface UpdateBimestreDto {
  nombre?: string;
  fechaInicio?: string; // Cambiado a string para manejar conversión manual
  fechaFin?: string;    // Cambiado a string para manejar conversión manual
  activo?: boolean;
  fechaPago1Inicio?: string;
  fechaPago1Fin?: string;
  fechaPago2Inicio?: string;
  fechaPago2Fin?: string;
  descripcion?: string;
  factor?: number;
}

@Injectable()
export class BimestreService {
  private readonly logger = new Logger(BimestreService.name);

  constructor(
    @InjectRepository(Bimestre)
    private readonly bimestreRepository: Repository<Bimestre>,
  ) {}

  private parseLocalDate(dateString: string): Date {
    const [day, month, year] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  async findAll(): Promise<Bimestre[]> {
    try {
      return await this.bimestreRepository.find({
        order: { anoAcademico: 'DESC', numeroBimestre: 'ASC' }
      });
    } catch (error) {
      this.logger.error('Error al obtener bimestres', error);
      throw error;
    }
  }

  async findByAnoAcademico(anoAcademico: number): Promise<Bimestre[]> {
    try {
      return await this.bimestreRepository.find({
        where: { anoAcademico },
        order: { numeroBimestre: 'ASC' }
      });
    } catch (error) {
      this.logger.error(`Error al obtener bimestres del año ${anoAcademico}`, error);
      throw error;
    }
  }

  async findActivos(): Promise<Bimestre[]> {
    try {
      return await this.bimestreRepository.find({
        where: { activo: true },
        order: { anoAcademico: 'DESC', numeroBimestre: 'ASC' }
      });
    } catch (error) {
      this.logger.error('Error al obtener bimestres activos', error);
      throw error;
    }
  }

  async findById(id: number): Promise<Bimestre> {
    try {
      const bimestre = await this.bimestreRepository.findOne({ where: { id } });
      
      if (!bimestre) {
        throw new NotFoundException(`Bimestre con ID ${id} no encontrado`);
      }

      return bimestre;
    } catch (error) {
      this.logger.error(`Error al obtener bimestre ${id}`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Bimestre con ID ${id} no encontrado`);
    }
  }

  async findBimestreActual(): Promise<Bimestre | null> {
    try {
      const fechaActual = new Date();
      return await this.bimestreRepository.findOne({
        where: {
          fechaInicio: LessThan(fechaActual),
          fechaFin: MoreThan(fechaActual),
          activo: true
        }
      });
    } catch (error) {
      this.logger.error('Error al obtener bimestre actual', error);
      return null;
    }
  }

  async findBimestreByFecha(fecha: Date): Promise<Bimestre | null> {
    try {
      return await this.bimestreRepository.findOne({
        where: {
          fechaInicio: LessThan(fecha),
          fechaFin: MoreThan(fecha),
          activo: true
        }
      });
    } catch (error) {
      this.logger.error('Error al buscar bimestre por fecha', error);
      return null;
    }
  }

  async create(createBimestreDto: CreateBimestreDto): Promise<Bimestre> {
    try {
      // Log para debuggear el campo factor
      this.logger.log(`Datos recibidos para crear bimestre: ${JSON.stringify(createBimestreDto)}`);
      this.logger.log(`Campo factor recibido: ${createBimestreDto.factor} (tipo: ${typeof createBimestreDto.factor})`);
      
      // Convertir fechas de string a Date
      const fechaInicio = this.parseLocalDate(createBimestreDto.fechaInicio);
      const fechaFin = this.parseLocalDate(createBimestreDto.fechaFin);
      
      // Validar que la fecha de inicio sea anterior a la fecha de fin
      if (fechaInicio >= fechaFin) {
        throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
      }

      // Validar solapamiento de fechas
      await this.validateDateOverlap(fechaInicio, fechaFin, createBimestreDto.anoAcademico);

      const bimestre = this.bimestreRepository.create({
        ...createBimestreDto,
        fechaInicio,
        fechaFin,
        fechaPago1Inicio: createBimestreDto.fechaPago1Inicio ? this.parseLocalDate(createBimestreDto.fechaPago1Inicio) : null,
        fechaPago1Fin: createBimestreDto.fechaPago1Fin ? this.parseLocalDate(createBimestreDto.fechaPago1Fin) : null,
        fechaPago2Inicio: createBimestreDto.fechaPago2Inicio ? this.parseLocalDate(createBimestreDto.fechaPago2Inicio) : null,
        fechaPago2Fin: createBimestreDto.fechaPago2Fin ? this.parseLocalDate(createBimestreDto.fechaPago2Fin) : null,
        activo: createBimestreDto.activo ?? true,
        factor: createBimestreDto.factor
      });
      
      this.logger.log(`Bimestre creado con factor: ${bimestre.factor}`);

      const savedBimestre = await this.bimestreRepository.save(bimestre);
      this.logger.log(`Bimestre creado: ${savedBimestre.nombre}`);
      return savedBimestre;
    } catch (error) {
      this.logger.error('Error al crear bimestre', error);
      throw error;
    }
  }

  async update(id: number, updateBimestreDto: UpdateBimestreDto): Promise<Bimestre> {
    try {
      // Log para debuggear el campo factor en actualización
      this.logger.log(`Datos recibidos para actualizar bimestre ${id}: ${JSON.stringify(updateBimestreDto)}`);
      this.logger.log(`Campo factor recibido: ${updateBimestreDto.factor} (tipo: ${typeof updateBimestreDto.factor})`);
      
      const bimestre = await this.findById(id);
      
      // Preparar datos de actualización
      const updateData: any = { ...updateBimestreDto };
      
      // Manejar explícitamente el campo factor
      if (updateBimestreDto.hasOwnProperty('factor')) {
        updateData.factor = updateBimestreDto.factor;
        this.logger.log(`Campo factor será actualizado a: ${updateData.factor}`);
      }
      
      // Convertir fechas si están presentes
      if (updateBimestreDto.fechaInicio) {
        updateData.fechaInicio = this.parseLocalDate(updateBimestreDto.fechaInicio);
      }
      if (updateBimestreDto.fechaFin) {
        updateData.fechaFin = this.parseLocalDate(updateBimestreDto.fechaFin);
      }
      if (updateBimestreDto.fechaPago1Inicio) {
        updateData.fechaPago1Inicio = this.parseLocalDate(updateBimestreDto.fechaPago1Inicio);
      }
      if (updateBimestreDto.fechaPago1Fin) {
        updateData.fechaPago1Fin = this.parseLocalDate(updateBimestreDto.fechaPago1Fin);
      }
      if (updateBimestreDto.fechaPago2Inicio) {
        updateData.fechaPago2Inicio = this.parseLocalDate(updateBimestreDto.fechaPago2Inicio);
      }
      if (updateBimestreDto.fechaPago2Fin) {
        updateData.fechaPago2Fin = this.parseLocalDate(updateBimestreDto.fechaPago2Fin);
      }
      
      // Validar fechas si se están actualizando
      const fechaInicio = updateData.fechaInicio || bimestre.fechaInicio;
      const fechaFin = updateData.fechaFin || bimestre.fechaFin;
      
      if (fechaInicio >= fechaFin) {
        throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
      }

      // Validar solapamiento de fechas (excluyendo el bimestre actual)
      await this.validateDateOverlap(fechaInicio, fechaFin, bimestre.anoAcademico, id);

      Object.assign(bimestre, updateData);
      const updatedBimestre = await this.bimestreRepository.save(bimestre);
      
      this.logger.log(`Bimestre actualizado: ${updatedBimestre.nombre}`);
      return updatedBimestre;
    } catch (error) {
      this.logger.error(`Error al actualizar bimestre ${id}`, error);
      throw error;
    }
  }

  async checkDependencies(id: number): Promise<{
    hasEvents: boolean;
    eventCount: number;
    tables: string[];
  }> {
    try {
      const dependencies = {
        hasEvents: false,
        eventCount: 0,
        tables: [] as string[]
      };

      // Verificar staging_dol
      const stagingDolCount = await this.bimestreRepository.query(
        'SELECT COUNT(*) as count FROM staging_dol WHERE id_bimestre = ?',
        [id]
      );
      if (stagingDolCount[0].count > 0) {
        dependencies.hasEvents = true;
        dependencies.eventCount += parseInt(stagingDolCount[0].count);
        dependencies.tables.push('staging_dol');
      }

      // Verificar schedule_events si existe
      try {
        const scheduleEventsCount = await this.bimestreRepository.query(
          'SELECT COUNT(*) as count FROM schedule_events WHERE bimestre_id = ?',
          [id]
        );
        if (scheduleEventsCount[0].count > 0) {
          dependencies.hasEvents = true;
          dependencies.eventCount += parseInt(scheduleEventsCount[0].count);
          dependencies.tables.push('schedule_events');
        }
      } catch (error) {
        // Tabla schedule_events puede no existir
        this.logger.warn('Tabla schedule_events no encontrada, continuando...');
      }

      // Verificar todas las tablas relacionadas con bimestres
      const relatedTables = [
        // Tablas de permisos
        { name: 'usuario_permisos_carrera', column: 'bimestre_id' },
        { name: 'usuario_permisos_categoria', column: 'bimestre_id' },
        { name: 'permisos_pendientes', column: 'bimestre_id' },
        
        // Tablas staging
        { name: 'staging_adol', column: 'id_bimestre' },
        { name: 'staging_cursables', column: 'id_bimestre' },
        { name: 'staging_docentes', column: 'id_bimestre' },
        { name: 'staging_estructura_academica', column: 'id_bimestre' },
        { name: 'staging_usuarios_agendador', column: 'id_bimestre' },
        { name: 'staging_vacantes', column: 'id_bimestre' },
        
        // Tablas finales
        { name: 'asignaturas', column: 'bimestre_id' },
        { name: 'carreras', column: 'bimestre_id' }
      ];

      for (const table of relatedTables) {
        try {
          const count = await this.bimestreRepository.query(
            `SELECT COUNT(*) as count FROM ${table.name} WHERE ${table.column} = ?`,
            [id]
          );
          if (count[0].count > 0) {
            dependencies.hasEvents = true;
            dependencies.eventCount += parseInt(count[0].count);
            dependencies.tables.push(table.name);
          }
        } catch (error) {
          // Tabla puede no existir
          this.logger.warn(`Tabla ${table.name} no encontrada, continuando...`);
        }
      }

      return dependencies;
    } catch (error) {
      this.logger.error(`Error al verificar dependencias del bimestre ${id}`, error);
      throw error;
    }
  }

  async deleteWithEvents(id: number): Promise<void> {
    try {
      // Verificar que el bimestre existe
      await this.findById(id);

      // Eliminar todos los datos asociados al bimestre
      const dependencies = await this.checkDependencies(id);
      
      this.logger.log(`Eliminando todos los datos asociados al bimestre ${id}`);
      
      // Definir todas las tablas que tienen relación con bimestres en orden de eliminación
      // (respetando foreign keys - eliminar dependientes primero)
      const tablesToClean = [
        // Tablas de permisos (eliminar primero)
        { name: 'usuario_permisos_carrera', column: 'bimestre_id' },
        { name: 'usuario_permisos_categoria', column: 'bimestre_id' },
        { name: 'permisos_pendientes', column: 'bimestre_id' },
        
        // Tablas staging
        { name: 'staging_dol', column: 'id_bimestre' },
        { name: 'staging_cursables', column: 'id_bimestre' },
        { name: 'staging_docentes', column: 'id_bimestre' },
        { name: 'staging_estructura_academica', column: 'id_bimestre' },
        { name: 'staging_usuarios_agendador', column: 'id_bimestre' },
        { name: 'staging_vacantes', column: 'id_bimestre' },
        { name: 'staging_adol', column: 'id_bimestre' },
        
        // Tabla de eventos
        { name: 'schedule_events', column: 'bimestre_id' },
        
        // Tablas finales (eliminar después de staging)
        { name: 'asignaturas', column: 'bimestre_id' },
        { name: 'carreras', column: 'bimestre_id' }
      ];
      
      let totalDeleted = 0;
      
      // Eliminar en orden específico para respetar foreign keys
      for (const table of tablesToClean) {
        try {
          const result = await this.bimestreRepository.query(
            `DELETE FROM ${table.name} WHERE ${table.column} = ?`,
            [id]
          );
          
          const deleted = result.affectedRows || 0;
          if (deleted > 0) {
            this.logger.log(`Eliminados ${deleted} registros de ${table.name}`);
            totalDeleted += deleted;
          }
        } catch (error) {
          // Continuar con otras tablas aunque una falle
          this.logger.warn(`Error al eliminar de ${table.name}:`, error.message);
        }
      }
      
      this.logger.log(`Total de registros eliminados: ${totalDeleted}`);

      // Finalmente eliminar el bimestre
      const result = await this.bimestreRepository.delete(id);
      
      if (result.affected === 0) {
        throw new NotFoundException(`Bimestre con ID ${id} no encontrado`);
      }
      
      this.logger.log(`Bimestre eliminado: ID ${id}`);
    } catch (error) {
      this.logger.error(`Error al eliminar bimestre ${id}`, error);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const result = await this.bimestreRepository.delete(id);
      
      if (result.affected === 0) {
        throw new NotFoundException(`Bimestre con ID ${id} no encontrado`);
      }
      
      this.logger.log(`Bimestre eliminado: ID ${id}`);
    } catch (error) {
      this.logger.error(`Error al eliminar bimestre ${id}`, error);
      throw error;
    }
  }

  async procesarCargaMasiva(fileBuffer: Buffer): Promise<{ bimestresCreados: number; años: number[] }> {
    try {
      // Leer el archivo Excel
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir a JSON
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Validar que tenga al menos el encabezado y 5 filas de datos
      if (data.length < 6) {
        throw new BadRequestException('El archivo debe contener exactamente 5 bimestres');
      }
      
      // Obtener encabezados (primera fila)
      const headers = data[0] as string[];
      const expectedHeaders = ['Número', 'Año', 'Fecha_Inicio', 'Fecha_Fin', 'Pago1_Inicio', 'Pago1_Fin', 'Pago2_Inicio', 'Pago2_Fin', 'Descripción', 'Factor'];
      
      // Validar encabezados
      for (let i = 0; i < expectedHeaders.length; i++) {
        if (!headers[i] || headers[i].trim() !== expectedHeaders[i]) {
          throw new BadRequestException(`Encabezado incorrecto en columna ${i + 1}. Se esperaba '${expectedHeaders[i]}' pero se encontró '${headers[i] || 'vacío'}'`);
        }
      }
      
      // Procesar filas de datos (saltando el encabezado)
      const filasDatos = data.slice(1, 6); // Solo las primeras 5 filas de datos
      
      if (filasDatos.length !== 5) {
        throw new BadRequestException('El archivo debe contener exactamente 5 bimestres');
      }
      
      // Validar y convertir datos
      const bimestresData: CreateBimestreDto[] = [];
      const añosEncontrados = new Set<number>();
      
      for (let i = 0; i < filasDatos.length; i++) {
        const fila = filasDatos[i] as any[];
        const numeroFila = i + 2; // +2 porque empezamos en fila 1 (índice 0) y saltamos encabezado
        
        // Validar que la fila tenga todos los campos requeridos
        if (fila.length < 10) {
          throw new BadRequestException(`Fila ${numeroFila}: Faltan datos. Se requieren 10 columnas.`);
        }
        
        const numero = Number(fila[0]);
        const año = Number(fila[1]);
        const fechaInicio = this.formatearFecha(fila[2]);
        const fechaFin = this.formatearFecha(fila[3]);
        const pago1Inicio = this.formatearFecha(fila[4]);
        const pago1Fin = this.formatearFecha(fila[5]);
        const pago2Inicio = this.formatearFecha(fila[6]);
        const pago2Fin = this.formatearFecha(fila[7]);
        const descripcion = fila[8] ? String(fila[8]).trim() : '';
        // Procesar el campo factor manejando separadores decimales europeos (coma como decimal)
        let factor = undefined;
        if (fila[9]) {
          const factorStr = String(fila[9]).trim();
          this.logger.debug(`Procesando factor en fila ${numeroFila}: valor original='${factorStr}'`);
          
          // Si contiene coma, asumimos formato europeo (coma como decimal)
          if (factorStr.includes(',')) {
            factor = Number(factorStr.replace(',', '.'));
            this.logger.debug(`Factor con coma convertido: '${factorStr}' -> ${factor}`);
          } else {
            factor = Number(factorStr);
            this.logger.debug(`Factor sin coma convertido: '${factorStr}' -> ${factor}`);
          }
          
          // Validar que el factor esté en un rango razonable para DECIMAL(10,6)
          if (isNaN(factor) || factor < 0 || factor > 9999) {
            throw new BadRequestException(`Fila ${numeroFila}: Factor inválido '${factorStr}'. Debe ser un número decimal entre 0 y 9999.`);
          }
          
          this.logger.debug(`Factor final para fila ${numeroFila}: ${factor}`);
        }
        
        // Validaciones
        if (!numero || numero !== i + 1) {
          throw new BadRequestException(`Fila ${numeroFila}: El número de bimestre debe ser ${i + 1}`);
        }
        
        if (!año || año < 2020 || año > 2030) {
          throw new BadRequestException(`Fila ${numeroFila}: Año inválido. Debe estar entre 2020 y 2030`);
        }
        
        añosEncontrados.add(año);
        
        // Validar formato de fechas
        if (!fechaInicio || !fechaFin || !pago1Inicio || !pago1Fin || !pago2Inicio || !pago2Fin) {
          throw new BadRequestException(`Fila ${numeroFila}: Todas las fechas son obligatorias`);
        }
        
        bimestresData.push({
          nombre: `Bimestre ${año} ${numero}`,
          fechaInicio,
          fechaFin,
          fechaPago1Inicio: pago1Inicio,
          fechaPago1Fin: pago1Fin,
          fechaPago2Inicio: pago2Inicio,
          fechaPago2Fin: pago2Fin,
          anoAcademico: año,
          numeroBimestre: numero,
          descripcion,
          factor
        });
      }
      
      // Validar que no existan bimestres para los años encontrados
      for (const año of añosEncontrados) {
        const bimestresExistentes = await this.findByAnoAcademico(año);
        if (bimestresExistentes.length > 0) {
          throw new BadRequestException(`Ya existen bimestres para el año académico ${año}. Debe eliminarlos antes de realizar la carga masiva.`);
        }
      }
      
      // Crear todos los bimestres
      let bimestresCreados = 0;
      for (const bimestreData of bimestresData) {
        await this.create(bimestreData);
        bimestresCreados++;
      }
      
      return {
        bimestresCreados,
        años: Array.from(añosEncontrados)
      };
      
    } catch (error) {
      this.logger.error('Error procesando carga masiva', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error procesando archivo Excel: ${error.message}`);
    }
  }
  
  private formatearFecha(fecha: any): string {
    if (!fecha) return '';
    
    // Si es un número (fecha de Excel)
    if (typeof fecha === 'number') {
      const excelDate = new Date((fecha - 25569) * 86400 * 1000);
      const day = String(excelDate.getDate()).padStart(2, '0');
      const month = String(excelDate.getMonth() + 1).padStart(2, '0');
      const year = excelDate.getFullYear();
      return `${day}-${month}-${year}`;
    }
    
    // Si es una cadena, validar formato DD-MM-YYYY
    if (typeof fecha === 'string') {
      const fechaStr = fecha.trim();
      const regex = /^\d{2}-\d{2}-\d{4}$/;
      if (regex.test(fechaStr)) {
        return fechaStr;
      }
      // Intentar convertir otros formatos comunes
      const dateObj = new Date(fechaStr);
      if (!isNaN(dateObj.getTime())) {
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}-${month}-${year}`;
      }
    }
    
    throw new BadRequestException(`Formato de fecha inválido: ${fecha}. Use DD-MM-YYYY`);
  }

  private async validateDateOverlap(fechaInicio: Date, fechaFin: Date, anoAcademico: number, excludeId?: number): Promise<void> {
    // Buscar bimestres del mismo año que puedan tener solapamiento
    const whereCondition: any = {
      anoAcademico,
      activo: true
    };
    
    if (excludeId) {
      whereCondition.id = Not(excludeId);
    }
    
    const bimestresDelAno = await this.bimestreRepository.find({
      where: whereCondition
    });

    // Verificar solapamiento manualmente
    for (const bimestre of bimestresDelAno) {
      const existingStart = new Date(bimestre.fechaInicio);
      const existingEnd = new Date(bimestre.fechaFin);
      
      // Lógica de solapamiento: dos rangos se solapan si (startA < endB) AND (endA > startB)
      const hasOverlap = fechaInicio < existingEnd && fechaFin > existingStart;
      
      if (hasOverlap) {
        throw new BadRequestException(
          `Las fechas del bimestre se solapan con "${bimestre.nombre}" ` +
          `(${existingStart.toLocaleDateString('es-ES')} - ${existingEnd.toLocaleDateString('es-ES')})`
        );
      }
    }
  }
}
