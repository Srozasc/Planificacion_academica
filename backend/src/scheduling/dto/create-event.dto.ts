import {
  IsInt,
  IsDateString,
  IsString,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  IsIn,
  IsNumber,
  IsPositive,
} from 'class-validator';

export class CreateEventDto {
  @IsInt()
  @IsPositive()
  academic_structure_id: number;

  @IsInt()
  @IsPositive()
  teacher_id: number;

  @IsInt()
  @IsPositive()
  area_id: number;

  @IsDateString()
  start_datetime: string;

  @IsDateString()
  end_datetime: string;

  @IsString()
  @IsIn(['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'])
  day_of_week: string;

  @IsOptional()
  @IsString()
  classroom?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  vacancies?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  max_capacity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(10)
  weekly_hours?: number;

  @IsOptional()
  @IsString()
  academic_period?: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean;

  @IsOptional()
  @IsDateString()
  recurrence_end_date?: string;
}
