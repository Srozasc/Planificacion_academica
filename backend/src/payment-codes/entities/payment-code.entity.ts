import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  DeleteDateColumn,
  Index,
  Check
} from 'typeorm';

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

@Entity('payment_codes')
@Index(['code_name'])
@Index(['category'])
@Index(['type'])
@Index(['is_active'])
@Index(['valid_from', 'valid_until'])
@Check(`factor > 0`)
@Check(`base_amount IS NULL OR base_amount >= 0`)
@Check(`valid_until IS NULL OR valid_from IS NULL OR valid_until >= valid_from`)
export class PaymentCode {
  @PrimaryGeneratedColumn()
  id: number;

  // Información del código
  @Column({ 
    type: 'varchar', 
    length: 20, 
    unique: true,
    comment: 'Código único de pago (Ej: DOC1, ASI2, etc.)' 
  })
  code_name: string;

  @Column({ 
    type: 'varchar', 
    length: 255,
    comment: 'Descripción del código de pago' 
  })
  description: string;

  // Factor y cálculos
  @Column({ 
    type: 'decimal', 
    precision: 8, 
    scale: 4, 
    default: 1.0000,
    comment: 'Factor multiplicador para cálculos salariales' 
  })
  factor: number;

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2, 
    nullable: true,
    comment: 'Monto base en pesos chilenos' 
  })
  base_amount: number;

  // Categorización
  @Column({
    type: 'enum',
    enum: PaymentCodeCategory,
    default: PaymentCodeCategory.DOCENTE,
    comment: 'Categoría del código'
  })
  category: PaymentCodeCategory;

  @Column({
    type: 'enum',
    enum: PaymentCodeType,
    comment: 'Tipo de código de pago'
  })
  type: PaymentCodeType;

  // Configuración
  @Column({ 
    type: 'boolean', 
    default: true,
    comment: 'Si el código está activo' 
  })
  is_active: boolean;

  @Column({ 
    type: 'boolean', 
    default: false,
    comment: 'Si requiere especificar horas' 
  })
  requires_hours: boolean;

  @Column({ 
    type: 'boolean', 
    default: true,
    comment: 'Si está afecto a impuestos' 
  })
  is_taxable: boolean;

  // Validez temporal
  @Column({ 
    type: 'date', 
    nullable: true,
    comment: 'Fecha desde la cual es válido' 
  })
  valid_from: Date;

  @Column({ 
    type: 'date', 
    nullable: true,
    comment: 'Fecha hasta la cual es válido' 
  })
  valid_until: Date;

  // Campos de auditoría
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  // Métodos auxiliares
  isActive(): boolean {
    return this.is_active && !this.deleted_at;
  }

  isValidForDate(date: Date = new Date()): boolean {
    if (!this.isActive()) return false;
    
    const checkDate = new Date(date);
    
    if (this.valid_from && checkDate < new Date(this.valid_from)) {
      return false;
    }
    
    if (this.valid_until && checkDate > new Date(this.valid_until)) {
      return false;
    }
    
    return true;
  }

  calculateAmount(hours?: number, baseOverride?: number): number {
    const base = baseOverride || this.base_amount || 0;
    const factor = this.factor || 1;
    
    if (this.requires_hours && hours) {
      return base * factor * hours;
    }
    
    return base * factor;
  }

  getTypeDescription(): string {
    const typeDescriptions = {
      [PaymentCodeType.CATEGORIA]: 'Categoría',
      [PaymentCodeType.CONTRATO]: 'Tipo de Contrato',
      [PaymentCodeType.BONO]: 'Bono/Asignación',
      [PaymentCodeType.DESCUENTO]: 'Descuento',
      [PaymentCodeType.HORA]: 'Hora Académica'
    };
    
    return typeDescriptions[this.type] || 'Otro';
  }

  getCategoryDescription(): string {
    const categoryDescriptions = {
      [PaymentCodeCategory.DOCENTE]: 'Docente',
      [PaymentCodeCategory.ADMINISTRATIVO]: 'Administrativo',
      [PaymentCodeCategory.OTRO]: 'Otro'
    };
    
    return categoryDescriptions[this.category] || 'Otro';
  }

  formatAmount(): string {
    if (!this.base_amount) return 'N/A';
    
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(this.base_amount);
  }

  getValidityStatus(): 'active' | 'pending' | 'expired' | 'inactive' {
    if (!this.is_active || this.deleted_at) return 'inactive';
    
    const now = new Date();
    
    if (this.valid_from && now < new Date(this.valid_from)) {
      return 'pending';
    }
    
    if (this.valid_until && now > new Date(this.valid_until)) {
      return 'expired';
    }
    
    return 'active';
  }

  isTeacherCategory(): boolean {
    return this.category === PaymentCodeCategory.DOCENTE && 
           this.type === PaymentCodeType.CATEGORIA;
  }

  isContractType(): boolean {
    return this.type === PaymentCodeType.CONTRATO;
  }

  isBonus(): boolean {
    return this.type === PaymentCodeType.BONO;
  }

  isDiscount(): boolean {
    return this.type === PaymentCodeType.DESCUENTO;
  }

  isHourlyRate(): boolean {
    return this.type === PaymentCodeType.HORA;
  }
}
