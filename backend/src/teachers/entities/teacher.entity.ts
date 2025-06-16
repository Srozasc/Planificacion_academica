import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  DeleteDateColumn,
  Index
} from 'typeorm';

@Entity('teachers')
@Index(['rut'])
@Index(['email'])
@Index(['category_id'])
@Index(['contract_type_id'])
@Index(['is_active'])
@Index(['can_coordinate'])
@Index(['hire_date'])
export class Teacher {
  @PrimaryGeneratedColumn()
  id: number;

  // Información personal
  @Column({ 
    type: 'varchar', 
    length: 12, 
    unique: true,
    comment: 'RUT del docente (formato: 12345678-9)' 
  })
  rut: string;

  @Column({ 
    type: 'varchar', 
    length: 255,
    comment: 'Nombre completo del docente' 
  })
  name: string;

  @Column({ 
    type: 'varchar', 
    length: 255, 
    unique: true,
    comment: 'Email institucional del docente' 
  })
  email: string;

  @Column({ 
    type: 'varchar', 
    length: 20, 
    nullable: true,
    comment: 'Teléfono de contacto' 
  })
  phone: string;

  @Column({ 
    type: 'text', 
    nullable: true,
    comment: 'Dirección de residencia' 
  })
  address: string;

  // Información académica
  @Column({ 
    type: 'varchar', 
    length: 100, 
    nullable: true,
    comment: 'Título académico (Ej: Magíster, Doctor)' 
  })
  academic_degree: string;

  @Column({ 
    type: 'varchar', 
    length: 255, 
    nullable: true,
    comment: 'Área de especialización' 
  })
  specialization: string;

  @Column({ 
    type: 'varchar', 
    length: 255, 
    nullable: true,
    comment: 'Universidad de origen del título' 
  })
  university: string;

  // Información contractual
  @Column({ 
    type: 'int', 
    nullable: true,
    comment: 'ID de categoría docente (FK a payment_codes)' 
  })
  category_id: number;

  @Column({ 
    type: 'int', 
    nullable: true,
    comment: 'ID tipo de contrato (FK a payment_codes)' 
  })
  contract_type_id: number;

  @Column({ 
    type: 'date', 
    nullable: true,
    comment: 'Fecha de contratación' 
  })
  hire_date: Date;

  @Column({ 
    type: 'int', 
    nullable: true,
    comment: 'Horas contractuales por semana' 
  })
  contract_hours: number;

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2, 
    nullable: true,
    comment: 'Salario base mensual' 
  })
  salary_base: number;

  // Estado y configuración
  @Column({ 
    type: 'boolean', 
    default: true,
    comment: 'Si el docente está activo' 
  })
  is_active: boolean;

  @Column({ 
    type: 'boolean', 
    default: false,
    comment: 'Si puede coordinar programas' 
  })
  can_coordinate: boolean;

  @Column({ 
    type: 'int', 
    default: 40,
    comment: 'Máximo de horas semanales que puede dictar' 
  })
  max_hours_per_week: number;

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

  canCoordinate(): boolean {
    return this.can_coordinate && this.isActive();
  }

  getFullInfo(): string {
    return `${this.academic_degree ? this.academic_degree + ' ' : ''}${this.name}`;
  }

  getAvailableHours(): number {
    return this.max_hours_per_week || 40;
  }

  formatRut(): string {
    // Formato: 12.345.678-9
    if (!this.rut) return '';
    const rut = this.rut.replace(/\./g, '').replace('-', '');
    const body = rut.slice(0, -1);
    const dv = rut.slice(-1);
    return body.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
  }

  validateRut(): boolean {
    if (!this.rut) return false;
    
    const rut = this.rut.replace(/\./g, '').replace('-', '');
    const body = rut.slice(0, -1);
    const dv = rut.slice(-1).toLowerCase();
    
    let sum = 0;
    let multiplier = 2;
    
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const remainder = sum % 11;
    const calculatedDv = remainder < 2 ? remainder.toString() : (11 - remainder === 10 ? 'k' : (11 - remainder).toString());
    
    return dv === calculatedDv;
  }
}
