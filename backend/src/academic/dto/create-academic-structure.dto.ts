import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsInt, 
  IsEnum, 
  IsBoolean, 
  Min, 
  Max, 
  MaxLength,
  IsArray
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AcademicStructureType } from '../entities/academic-structure.entity';

export class CreateAcademicStructureDto {
  @IsString({ message: 'El código debe ser un texto' })
  @IsNotEmpty({ message: 'El código es requerido' })
  @MaxLength(20, { message: 'El código no puede exceder 20 caracteres' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  code: string;

  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsOptional()
  @IsInt({ message: 'Los créditos deben ser un número entero' })
  @Min(0, { message: 'Los créditos no pueden ser negativos' })
  @Max(20, { message: 'Los créditos no pueden exceder 20' })
  credits?: number;

  @IsOptional()
  @IsInt({ message: 'El ID del plan debe ser un número entero' })
  plan_id?: number;

  @IsEnum(AcademicStructureType, { 
    message: 'El tipo debe ser: subject, plan o module' 
  })
  @IsOptional()
  type?: AcademicStructureType = AcademicStructureType.SUBJECT;

  @IsOptional()
  @IsInt({ message: 'El semestre debe ser un número entero' })
  @Min(1, { message: 'El semestre debe ser al menos 1' })
  @Max(10, { message: 'El semestre no puede exceder 10' })
  semester?: number;

  @IsOptional()
  @IsArray({ message: 'Los prerrequisitos deben ser un array' })
  @IsString({ each: true, message: 'Cada prerrequisito debe ser un texto' })
  prerequisites?: string[];

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  @MaxLength(1000, { message: 'La descripción no puede exceder 1000 caracteres' })
  description?: string;

  @IsOptional()
  @IsInt({ message: 'Las horas por semana deben ser un número entero' })
  @Min(0, { message: 'Las horas por semana no pueden ser negativas' })
  @Max(50, { message: 'Las horas por semana no pueden exceder 50' })
  hours_per_week?: number;

  @IsOptional()
  @IsBoolean({ message: 'is_active debe ser verdadero o falso' })
  is_active?: boolean = true;
}
