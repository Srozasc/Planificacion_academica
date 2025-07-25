import { IsString, MinLength, IsNotEmpty, IsNumber } from 'class-validator';

export class AdminChangePasswordDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  adminPassword: string;
}