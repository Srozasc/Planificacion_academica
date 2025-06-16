import { Expose, Transform } from 'class-transformer';

export class PaymentCodeResponseDto {
  @Expose()
  id: number;

  @Expose()
  code_name: string;

  @Expose()
  description: string;

  @Expose()
  @Transform(({ value }) => parseFloat(value))
  factor: number;

  @Expose()
  @Transform(({ value }) => value ? parseFloat(value) : null)
  base_amount: number | null;

  @Expose()
  category: string;

  @Expose()
  type: string;

  @Expose()
  is_active: boolean;

  @Expose()
  requires_hours: boolean;

  @Expose()
  is_taxable: boolean;

  @Expose()
  valid_from: Date | null;

  @Expose()
  valid_until: Date | null;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;

  // Método auxiliar para verificar si el código está vigente
  @Expose()
  get is_valid(): boolean {
    const now = new Date();
    const fromValid = !this.valid_from || new Date(this.valid_from) <= now;
    const untilValid = !this.valid_until || new Date(this.valid_until) >= now;
    return this.is_active && fromValid && untilValid;
  }

  // Método auxiliar para calcular el monto con factor
  calculateAmount(baseAmount?: number, hours?: number): number {
    const amount = baseAmount || this.base_amount || 0;
    const finalAmount = amount * this.factor;
    
    if (this.requires_hours && hours) {
      return finalAmount * hours;
    }
    
    return finalAmount;
  }
}
