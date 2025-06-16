import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsEmail, IsBoolean, IsInt, IsDecimal, IsDateString, Length, Min, Max, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { CreateTeacherDto } from './create-teacher.dto';

export class UpdateTeacherDto extends PartialType(CreateTeacherDto) {
  @IsOptional()
  @IsString({ message: 'El RUT debe ser una cadena de texto' })
  @Length(9, 12, { message: 'El RUT debe tener entre 9 y 12 caracteres' })
  @Matches(/^[0-9]+[-]?[0-9kK]$/, { message: 'Formato de RUT inválido' })
  rut?: string;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @Length(2, 255, { message: 'El nombre debe tener entre 2 y 255 caracteres' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @Length(8, 20, { message: 'El teléfono debe tener entre 8 y 20 caracteres' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'El grado académico debe ser una cadena de texto' })
  @Length(1, 100, { message: 'El grado académico debe tener máximo 100 caracteres' })
  academic_degree?: string;

  @IsOptional()
  @IsString({ message: 'La especialización debe ser una cadena de texto' })
  @Length(1, 255, { message: 'La especialización debe tener máximo 255 caracteres' })
  specialization?: string;

  @IsOptional()
  @IsString({ message: 'La universidad debe ser una cadena de texto' })
  @Length(1, 255, { message: 'La universidad debe tener máximo 255 caracteres' })
  university?: string;

  @IsOptional()
  @IsInt({ message: 'La categoría debe ser un número entero' })
  @Min(1, { message: 'La categoría debe ser mayor a 0' })
  category_id?: number;

  @IsOptional()
  @IsInt({ message: 'El tipo de contrato debe ser un número entero' })
  @Min(1, { message: 'El tipo de contrato debe ser mayor a 0' })
  contract_type_id?: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de contratación debe tener formato válido' })
  hire_date?: string;

  @IsOptional()
  @IsInt({ message: 'Las horas contractuales deben ser un número entero' })
  @Min(1, { message: 'Las horas contractuales deben ser mayor a 0' })
  @Max(48, { message: 'Las horas contractuales no pueden exceder 48 por semana' })
  contract_hours?: number;

  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' }, { message: 'El salario base debe ser un número decimal válido' })
  @Transform(({ value }) => parseFloat(value))
  salary_base?: number;

  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser verdadero o falso' })
  is_active?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'La capacidad de coordinación debe ser verdadero o falso' })
  can_coordinate?: boolean;

  @IsOptional()
  @IsInt({ message: 'Las horas máximas por semana deben ser un número entero' })
  @Min(1, { message: 'Las horas máximas por semana deben ser mayor a 0' })
  @Max(60, { message: 'Las horas máximas por semana no pueden exceder 60' })
  max_hours_per_week?: number;
}
