import { Expose, Transform } from 'class-transformer';

export class TeacherResponseDto {
  @Expose()
  id: number;

  @Expose()
  rut: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  phone: string;

  @Expose()
  address: string;

  @Expose()
  academic_degree: string;

  @Expose()
  specialization: string;

  @Expose()
  university: string;

  @Expose()
  category_id: number;

  @Expose()
  contract_type_id: number;

  @Expose()
  @Transform(({ value }) => value ? new Date(value).toISOString().split('T')[0] : null)
  hire_date: string;

  @Expose()
  contract_hours: number;

  @Expose()
  @Transform(({ value }) => value ? parseFloat(value) : null)
  salary_base: number;

  @Expose()
  is_active: boolean;

  @Expose()
  can_coordinate: boolean;

  @Expose()
  max_hours_per_week: number;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;

  // Campos calculados
  @Expose()
  @Transform(({ obj }) => {
    return `${obj.academic_degree ? obj.academic_degree + ' ' : ''}${obj.name}`;
  })
  full_name_with_degree: string;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.rut) return '';
    const rut = obj.rut.replace(/\./g, '').replace('-', '');
    const body = rut.slice(0, -1);
    const dv = rut.slice(-1);
    return body.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
  })
  formatted_rut: string;

  @Expose()
  @Transform(({ obj }) => {
    return obj.is_active && !obj.deleted_at;
  })
  is_available: boolean;

  @Expose()
  @Transform(({ obj }) => {
    return obj.can_coordinate && obj.is_active && !obj.deleted_at;
  })
  can_coordinate_now: boolean;

  @Expose()
  @Transform(({ obj }) => {
    return obj.max_hours_per_week || 40;
  })
  available_hours: number;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.hire_date) return null;
    const hire = new Date(obj.hire_date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - hire.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    return `${years} años, ${months} meses`;
  })
  seniority: string;

  @Expose()
  @Transform(({ obj }) => {
    const categories = {
      1: 'Profesor Titular',
      2: 'Profesor Asociado', 
      3: 'Profesor Asistente',
      4: 'Profesor Instructor',
      5: 'Profesor Hora'
    };
    return categories[obj.category_id] || 'Sin categoría';
  })
  category_name: string;

  @Expose()
  @Transform(({ obj }) => {
    const contracts = {
      1: 'Contrato Indefinido',
      2: 'Contrato a Plazo Fijo',
      3: 'Honorarios',
      4: 'Reemplazo'
    };
    return contracts[obj.contract_type_id] || 'Sin tipo definido';
  })
  contract_type_name: string;
}
