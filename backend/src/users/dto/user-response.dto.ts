import { Exclude, Expose, Transform } from 'class-transformer';

export class UserResponseDto {
    @Expose()
    id: number;

    @Expose()
    email_institucional: string;

    @Exclude()
    password_hash: string;

    @Expose()
    name: string;

    @Expose()
    role_id: number;    @Expose()
    is_active: boolean;

    @Expose()
    telefono: string;

    @Expose()
    documento_identificacion: string;

    @Expose()
    created_at: Date;

    @Expose()
    updated_at: Date;

    @Expose()
    @Transform(({ obj }) => obj.role?.name || null)
    role_name: string;
}
