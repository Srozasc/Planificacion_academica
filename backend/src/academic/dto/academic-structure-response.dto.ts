import { Exclude, Expose, Transform } from 'class-transformer';
import { AcademicStructureType } from '../entities/academic-structure.entity';

export class AcademicStructureResponseDto {
  @Expose()
  id: number;

  @Expose()
  code: string;

  @Expose()
  name: string;

  @Expose()
  credits: number;

  @Expose()
  plan_id: number;

  @Expose()
  type: AcademicStructureType;

  @Expose()
  semester: number;

  @Expose()
  @Transform(({ value }) => value ? value.split(',').map((p: string) => p.trim()) : [])
  prerequisites: string[];

  @Expose()
  description: string;

  @Expose()
  hours_per_week: number;

  @Expose()
  is_active: boolean;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;

  // Información del plan padre (si aplica)
  @Expose()
  @Transform(({ obj }) => obj.plan?.name || null)
  plan_name: string;

  @Expose()
  @Transform(({ obj }) => obj.plan?.code || null)
  plan_code: string;

  // Información calculada
  @Expose()
  @Transform(({ obj }) => obj.type === 'plan')
  is_plan: boolean;

  @Expose()
  @Transform(({ obj }) => obj.type === 'subject')
  is_subject: boolean;

  @Expose()
  @Transform(({ obj }) => obj.type === 'module')
  is_module: boolean;
}
