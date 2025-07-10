import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { EventTeacher } from '../../scheduling/entities/event-teacher.entity';

@Entity('teachers')
export class Teacher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 12, unique: true, comment: 'RUT del docente (formato: 12345678-9)' })
  rut: string;

  @Column({ type: 'varchar', length: 255, comment: 'Nombre completo del docente' })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true, comment: 'Email institucional del docente' })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true, comment: 'Teléfono de contacto' })
  phone?: string;

  @Column({ type: 'text', nullable: true, comment: 'Dirección de residencia' })
  address?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: 'Título académico (Ej: Magíster, Doctor)' })
  academic_degree?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'Área de especialización' })
  specialization?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'Universidad de origen del título' })
  university?: string;

  @Column({ type: 'int', nullable: true, comment: 'ID de categoría docente (FK a payment_codes)' })
  category_id?: number;

  @Column({ type: 'int', nullable: true, comment: 'ID tipo de contrato (FK a payment_codes)' })
  contract_type_id?: number;

  @Column({ type: 'date', nullable: true, comment: 'Fecha de contratación' })
  hire_date?: Date;

  @Column({ type: 'int', nullable: true, comment: 'Horas contractuales por semana' })
  contract_hours?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: 'Salario base mensual' })
  salary_base?: number;

  @Column({ type: 'boolean', default: true, comment: 'Si el docente está activo' })
  is_active: boolean;

  @Column({ type: 'boolean', default: false, comment: 'Si puede coordinar programas' })
  can_coordinate: boolean;

  @Column({ type: 'int', default: 40, comment: 'Máximo de horas semanales que puede dictar' })
  max_hours_per_week: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Relación con eventos a través de la tabla intermedia
  @OneToMany(() => EventTeacher, eventTeacher => eventTeacher.teacher)
  eventTeachers: EventTeacher[];
}