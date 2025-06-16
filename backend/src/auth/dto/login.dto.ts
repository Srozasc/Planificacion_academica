import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Debe proporcionar un email institucional válido' })
  email_institucional: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString()
  password: string;
}
