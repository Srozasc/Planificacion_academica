import { IsOptional, IsInt, Min, Max, IsEmail, IsBoolean, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryUsersDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'La página debe ser un número entero' })
    @Min(1, { message: 'La página debe ser mayor a 0' })
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'El límite debe ser un número entero' })
    @Min(1, { message: 'El límite debe ser mayor a 0' })
    @Max(100, { message: 'El límite no puede ser mayor a 100' })
    limit?: number = 10;

    @IsOptional()
    @IsEmail({}, { message: 'Debe ser un email válido' })
    email?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'El ID del rol debe ser un número entero' })
    role_id?: number;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean({ message: 'is_active debe ser verdadero o falso' })
    is_active?: boolean;

    @IsOptional()
    @IsString({ message: 'El término de búsqueda debe ser un texto' })
    search?: string;
}
