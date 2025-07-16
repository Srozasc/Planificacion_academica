import { IsEmail, IsNotEmpty, IsString, IsOptional, IsInt, Min, IsDateString } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email institucional es requerido' })
  emailInstitucional: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;

  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;



  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  telefono?: string;

  @IsInt({ message: 'El ID del rol debe ser un número entero' })
  @Min(1, { message: 'El ID del rol debe ser mayor a 0' })
  roleId: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de expiración del rol debe tener un formato válido' })
  roleExpiresAt?: string;

  @IsOptional()
  @IsInt({ message: 'El ID del rol anterior debe ser un número entero' })
  @Min(1, { message: 'El ID del rol anterior debe ser mayor a 0' })
  previousRoleId?: number;
}