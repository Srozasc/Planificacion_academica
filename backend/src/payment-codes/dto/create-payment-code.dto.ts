import { IsString, IsNotEmpty, IsDecimal, IsOptional, IsEnum, IsBoolean, IsDateString, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export enum PaymentCodeCategory {
  DOCENTE = 'docente',
  ADMINISTRATIVO = 'administrativo',
  OTRO = 'otro'
}

export enum PaymentCodeType {
  CATEGORIA = 'categoria',
  CONTRATO = 'contrato',
  BONO = 'bono',
  DESCUENTO = 'descuento',
  HORA = 'hora'
}

export class CreatePaymentCodeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => parseFloat(value))
  @Min(0.0001)
  factor: number;

  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  @Transform(({ value }) => value ? parseFloat(value) : null)
  @Min(0)
  base_amount?: number;

  @IsEnum(PaymentCodeCategory)
  category: PaymentCodeCategory;

  @IsEnum(PaymentCodeType)
  type: PaymentCodeType;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;

  @IsOptional()
  @IsBoolean()
  requires_hours?: boolean = false;

  @IsOptional()
  @IsBoolean()
  is_taxable?: boolean = true;

  @IsOptional()
  @IsDateString()
  valid_from?: string;

  @IsOptional()
  @IsDateString()
  valid_until?: string;
}
