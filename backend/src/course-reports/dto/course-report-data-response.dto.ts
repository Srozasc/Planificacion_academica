import { Expose, Transform, Type } from 'class-transformer';

export class CourseReportDataResponseDto {
  @Expose()
  id: number;

  @Expose()
  academic_structure_id: number;

  @Expose()
  student_count: number;

  @Expose()
  term: string;

  @Expose()
  year: number;

  @Expose()
  section: string;

  @Expose()
  modality: string;

  @Expose()
  enrolled_count: number;

  @Expose()
  passed_count: number;

  @Expose()
  failed_count: number;

  @Expose()
  withdrawn_count: number;

  @Expose()
  @Transform(({ value }) => value ? parseFloat(value) : null)
  weekly_hours: number;

  @Expose()
  @Transform(({ value }) => value ? parseFloat(value) : null)
  total_hours: number;

  @Expose()
  is_validated: boolean;

  @Expose()
  validated_by: number;

  @Expose()
  validated_at: Date;

  @Expose()
  notes: string;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;

  // Información de la estructura académica relacionada
  @Expose()
  @Type(() => Object)
  academic_structure: {
    id: number;
    name: string;
    code: string;
    level: string;
    area: string;
  };

  // Campos calculados
  @Expose()
  get full_period_name(): string {
    const termNames = {
      '1': 'Primer Semestre',
      '2': 'Segundo Semestre',
      'anual': 'Anual',
      'intensivo': 'Intensivo'
    };
    
    const sectionText = this.section ? ` - Sección ${this.section}` : '';
    return `${termNames[this.term]} ${this.year}${sectionText}`;
  }

  @Expose()
  get approval_rate(): number | null {
    if (!this.enrolled_count || this.passed_count === null) return null;
    return Math.round((this.passed_count / this.enrolled_count) * 100 * 100) / 100;
  }

  @Expose()
  get retention_rate(): number | null {
    if (!this.enrolled_count || this.withdrawn_count === null) return null;
    const retained = this.enrolled_count - this.withdrawn_count;
    return Math.round((retained / this.enrolled_count) * 100 * 100) / 100;
  }

  @Expose()
  get failure_rate(): number | null {
    if (!this.enrolled_count || this.failed_count === null) return null;
    return Math.round((this.failed_count / this.enrolled_count) * 100 * 100) / 100;
  }

  @Expose()
  get completed_count(): number | null {
    if (this.passed_count === null || this.failed_count === null) return null;
    return this.passed_count + this.failed_count;
  }

  @Expose()
  get is_data_complete(): boolean {
    return !!(
      this.student_count &&
      this.enrolled_count &&
      this.passed_count !== null &&
      this.failed_count !== null &&
      this.withdrawn_count !== null
    );
  }

  @Expose()
  get is_period_active(): boolean {
    const currentYear = new Date().getFullYear();
    return this.year >= currentYear;
  }

  // Método para validar consistencia de datos
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
