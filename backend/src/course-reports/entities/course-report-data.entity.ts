import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn
} from 'typeorm';
import { AcademicStructure } from '../../academic/entities/academic-structure.entity';
import { User } from '../../users/entities/user.entity';

export enum CourseTerm {
  FIRST = '1',
  SECOND = '2',
  ANNUAL = 'anual',
  INTENSIVE = 'intensivo'
}

export enum CourseModality {
  PRESENCIAL = 'presencial',
  ONLINE = 'online',
  MIXTA = 'mixta'
}

@Entity('course_reports_data')
export class CourseReportData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'academic_structure_id' })
  academic_structure_id: number;

  @Column({ type: 'int', default: 0, comment: 'Cantidad de estudiantes cursables' })
  student_count: number;

  @Column({ 
    type: 'enum', 
    enum: CourseTerm,
    comment: 'Semestre o período académico'
  })
  term: CourseTerm;

  @Column({ type: 'year', comment: 'Año académico' })
  year: number;

  @Column({ 
    type: 'varchar', 
    length: 10, 
    nullable: true,
    comment: 'Sección de la asignatura (A, B, C, etc.)'
  })
  section: string;

  @Column({ 
    type: 'enum', 
    enum: CourseModality,
    default: CourseModality.PRESENCIAL,
    comment: 'Modalidad de la asignatura'
  })
  modality: CourseModality;

  @Column({ 
    type: 'int', 
    nullable: true,
    comment: 'Estudiantes matriculados inicialmente'
  })
  enrolled_count: number;

  @Column({ 
    type: 'int', 
    nullable: true,
    comment: 'Estudiantes que aprobaron'
  })
  passed_count: number;

  @Column({ 
    type: 'int', 
    nullable: true,
    comment: 'Estudiantes que reprobaron'
  })
  failed_count: number;

  @Column({ 
    type: 'int', 
    nullable: true,
    comment: 'Estudiantes que se retiraron'
  })
  withdrawn_count: number;

  @Column({ 
    type: 'decimal', 
    precision: 4, 
    scale: 2, 
    nullable: true,
    comment: 'Horas semanales de la asignatura'
  })
  weekly_hours: number;

  @Column({ 
    type: 'decimal', 
    precision: 6, 
    scale: 2, 
    nullable: true,
    comment: 'Total de horas del período'
  })
  total_hours: number;

  @Column({ 
    type: 'boolean', 
    default: false,
    comment: 'Si los datos han sido validados'
  })
  is_validated: boolean;

  @Column({ 
    type: 'int', 
    nullable: true,
    comment: 'ID del usuario que validó'
  })
  validated_by: number;

  @Column({ 
    type: 'timestamp', 
    nullable: true,
    comment: 'Fecha de validación'
  })
  validated_at: Date;

  @Column({ 
    type: 'text', 
    nullable: true,
    comment: 'Observaciones adicionales del reporte'
  })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  // Relaciones
  @ManyToOne(() => AcademicStructure, { eager: true })
  @JoinColumn({ name: 'academic_structure_id' })
  academic_structure: AcademicStructure;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'validated_by' })
  validator: User;

  // Métodos auxiliares
  /**
   * Obtiene el nombre completo del período académico
   */
  getFullPeriodName(): string {
    const termNames = {
      [CourseTerm.FIRST]: 'Primer Semestre',
      [CourseTerm.SECOND]: 'Segundo Semestre',
      [CourseTerm.ANNUAL]: 'Anual',
      [CourseTerm.INTENSIVE]: 'Intensivo'
    };
    
    const sectionText = this.section ? ` - Sección ${this.section}` : '';
    return `${termNames[this.term]} ${this.year}${sectionText}`;
  }

  /**
   * Calcula la tasa de aprobación si hay datos disponibles
   */
  getApprovalRate(): number | null {
    if (!this.enrolled_count || !this.passed_count) return null;
    return Math.round((this.passed_count / this.enrolled_count) * 100 * 100) / 100;
  }

  /**
   * Calcula la tasa de retención (no retirados)
   */
  getRetentionRate(): number | null {
    if (!this.enrolled_count || this.withdrawn_count === null) return null;
    const retained = this.enrolled_count - this.withdrawn_count;
    return Math.round((retained / this.enrolled_count) * 100 * 100) / 100;
  }

  /**
   * Calcula la tasa de reprobación
   */
  getFailureRate(): number | null {
    if (!this.enrolled_count || !this.failed_count) return null;
    return Math.round((this.failed_count / this.enrolled_count) * 100 * 100) / 100;
  }

  /**
   * Verifica si los datos están completos
   */
  isDataComplete(): boolean {
    return !!(
      this.student_count &&
      this.enrolled_count &&
      this.passed_count !== null &&
      this.failed_count !== null &&
      this.withdrawn_count !== null
    );
  }

  /**
   * Verifica si el período está activo (año actual o futuro)
   */
  isPeriodActive(): boolean {
    const currentYear = new Date().getFullYear();
    return this.year >= currentYear;
  }

  /**
   * Obtiene el total de estudiantes que completaron el curso (aprobados + reprobados)
   */
  getCompletedCount(): number | null {
    if (this.passed_count === null || this.failed_count === null) return null;
    return this.passed_count + this.failed_count;
  }

  /**
   * Verifica la consistencia de los datos
   */
  validateDataConsistency(): string[] {
    const errors: string[] = [];

    if (this.enrolled_count && this.passed_count !== null && this.failed_count !== null && this.withdrawn_count !== null) {
      const total = this.passed_count + this.failed_count + this.withdrawn_count;
      if (total > this.enrolled_count) {
        errors.push('La suma de aprobados, reprobados y retirados no puede ser mayor a los matriculados');
      }
    }

    if (this.student_count < 0) {
      errors.push('La cantidad de estudiantes cursables no puede ser negativa');
    }

    if (this.weekly_hours && this.total_hours) {
      // Asumiendo semestres de 18 semanas
      const expectedTotal = this.weekly_hours * 18;
      if (Math.abs(this.total_hours - expectedTotal) > this.weekly_hours) {
        errors.push('Las horas totales no coinciden con las horas semanales esperadas');
      }
    }

    return errors;
  }
}
