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

  @Column({ type: 'varchar', length: 255, nullable: false, comment: 'Email institucional del docente' })
  email: string;

  @Column({ type: 'int', nullable: true, comment: 'ID de categoría docente' })
  category_id?: number;

  @Column({ type: 'int', nullable: true, comment: 'ID tipo de contrato' })
  contract_type_id?: number;

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

  @Column({ type: 'varchar', length: 50, nullable: true, comment: 'ID externo del docente' })
  id_docente?: string;

  @Column({ type: 'int', nullable: true, comment: 'ID del bimestre' })
  id_bimestre?: number;

  // Relación con eventos a través de la tabla intermedia
  @OneToMany(() => EventTeacher, eventTeacher => eventTeacher.teacher)
  eventTeachers: EventTeacher[];
}