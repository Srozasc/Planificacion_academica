import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsOptional()
    email_institucional?: string;

    @IsOptional()
    password?: string;

    @IsOptional()
    name?: string;

    @IsOptional()
    role_id?: number;    @IsOptional()
    is_active?: boolean;

    @IsOptional()
    telefono?: string;    @IsOptional()
    documento_identificacion?: string;
}
