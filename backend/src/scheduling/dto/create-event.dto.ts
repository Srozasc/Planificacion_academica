import { IsString, IsNotEmpty, IsOptional, IsDateString, IsInt, Min, Max, Matches, IsArray, IsNumber, IsDecimal } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  start_date: string;

  @IsDateString()
  @IsNotEmpty()
  end_date: string;

  @IsString()
  @IsOptional()
  teacher?: string; // Campo legacy para compatibilidad

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  teacher_ids?: number[]; // Nuevo campo para múltiples docentes

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  room?: string;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'students must be at least 1 if provided' })
  @Max(1000)
  @Transform(({ value }) => {
    // Si el valor es undefined, null, o string vacío, retornar undefined
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const parsed = parseInt(value);
    // Si el valor parseado es 0 o NaN, retornar undefined para que sea tratado como opcional
    return (parsed === 0 || isNaN(parsed)) ? undefined : parsed;
  })
  students?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'horas must be a decimal number with at most 2 decimal places' })
  @Min(0.01, { message: 'horas must be greater than 0 if provided' })
  @Max(99.99, { message: 'horas must not exceed 99.99' })
  @Transform(({ value }) => {
    // Si el valor es undefined, null, o string vacío, retornar undefined
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const parsed = parseFloat(value);
    // Si el valor parseado es 0 o NaN, retornar undefined para que sea tratado como opcional
    return (parsed === 0 || isNaN(parsed)) ? undefined : parsed;
  })
  horas?: number; // Cantidad de horas para eventos ADOL

  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'backgroundColor must be a valid hex color (e.g., #FF5733)',
  })
  @IsOptional()
  background_color?: string;

  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  bimestre_id?: number;
}
