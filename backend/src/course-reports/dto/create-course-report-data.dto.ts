import { 
  IsNotEmpty, 
  IsInt, 
  IsEnum, 
  IsOptional, 
  IsString, 
  IsDecimal, 
  IsBoolean,
  IsDateString,
  Min, 
  Max, 
  MaxLength 
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CourseTerm, CourseModality } from '../entities/course-report-data.entity';

export class CreateCourseReportDataDto {
  @IsInt()
  @Min(1)
  academic_structure_id: number;

  @IsInt()
  @Min(0)
  student_count: number;

  @IsEnum(CourseTerm)
  term: CourseTerm;

  @IsInt()
  @Min(2020)
  @Max(2050)
  year: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  section?: string;

  @IsOptional()
  @IsEnum(CourseModality)
  modality?: CourseModality = CourseModality.PRESENCIAL;

  @IsOptional()
  @IsInt()
  @Min(0)
  enrolled_count?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  passed_count?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  failed_count?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  withdrawn_count?: number;

  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  @Transform(({ value }) => value ? parseFloat(value) : null)
  @Min(0.1)
  weekly_hours?: number;

  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  @Transform(({ value }) => value ? parseFloat(value) : null)
  @Min(0.1)
  total_hours?: number;

  @IsOptional()
  @IsBoolean()
  is_validated?: boolean = false;

  @IsOptional()
  @IsInt()
  @Min(1)
  validated_by?: number;

  @IsOptional()
  @IsDateString()
  validated_at?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
