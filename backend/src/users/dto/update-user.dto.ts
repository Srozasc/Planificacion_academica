import { IsOptional, IsString, IsEmail, IsNumber, IsBoolean, MinLength, IsDateString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'El email institucional debe ser válido' })
  emailInstitucional?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  name?: string;



  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El ID del rol debe ser un número' })
  roleId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de expiración del rol debe ser válida' })
  roleExpiresAt?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El ID del rol anterior debe ser un número' })
  previousRoleId?: number;
}