import { IsEmail, IsNotEmpty, IsString, IsInt, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
    @IsEmail({}, { message: 'Debe ser un email válido' })
    @IsNotEmpty({ message: 'El email institucional es requerido' })
    @MaxLength(255, { message: 'El email no puede exceder 255 caracteres' })
    email_institucional: string;

    @IsString({ message: 'La contraseña debe ser un texto' })
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    @MaxLength(100, { message: 'La contraseña no puede exceder 100 caracteres' })
    @IsOptional()
    password?: string;

    @IsString({ message: 'El nombre debe ser un texto' })
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
    @Transform(({ value }) => value?.trim())
    name: string;

    @IsInt({ message: 'El ID del rol debe ser un número entero' })
    @IsNotEmpty({ message: 'El rol es requerido' })
    role_id: number;    @IsBoolean({ message: 'is_active debe ser verdadero o falso' })
    @IsOptional()
    is_active?: boolean = true;

    @IsString({ message: 'El teléfono debe ser un texto' })
    @IsOptional()
    @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
    telefono?: string;    @IsString({ message: 'El documento debe ser un texto' })
    @IsOptional()
    @MaxLength(50, { message: 'El documento no puede exceder 50 caracteres' })
    documento_identificacion?: string;
}
