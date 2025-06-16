import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';

export enum AcademicStructureType {
  SUBJECT = 'subject',
  PLAN = 'plan',
  MODULE = 'module'
}

@Entity('academic_structures')
@Index(['code'])
@Index(['plan_id'])
@Index(['type'])
@Index(['is_active'])
@Index(['semester'])
export class AcademicStructure {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ 
    type: 'varchar', 
    length: 20, 
    unique: true,
    comment: 'Código único de la asignatura/plan' 
  })
  code: string;

  @Column({ 
    type: 'varchar', 
    length: 255,
    comment: 'Nombre de la asignatura o plan' 
  })
  name: string;

  @Column({ 
    type: 'int', 
    nullable: true,
    comment: 'Número de créditos de la asignatura' 
  })
  credits: number;

  @Column({ 
    type: 'int', 
    nullable: true,
    comment: 'ID del plan de estudios al que pertenece' 
  })
  plan_id: number;

  @Column({
    type: 'enum',
    enum: AcademicStructureType,
    default: AcademicStructureType.SUBJECT,
    comment: 'Tipo: asignatura, plan o módulo'
  })
  type: AcademicStructureType;

  @Column({ 
    type: 'int', 
    nullable: true,
    comment: 'Semestre recomendado (1-10)' 
  })
  semester: number;

  @Column({ 
    type: 'text', 
    nullable: true,
    comment: 'Códigos de asignaturas prerrequisito separados por coma' 
  })
  prerequisites: string;

  @Column({ 
    type: 'text', 
    nullable: true,
    comment: 'Descripción detallada' 
  })
  description: string;

  @Column({ 
    type: 'int', 
    nullable: true,
    comment: 'Horas académicas por semana' 
  })
  hours_per_week: number;

  @Column({ 
    type: 'boolean', 
    default: true,
    comment: 'Si está activo en el sistema' 
  })
  is_active: boolean;

  // Campos de auditoría
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  // Relaciones
  @ManyToOne(() => AcademicStructure, { nullable: true })
  @JoinColumn({ name: 'plan_id' })
  plan: AcademicStructure;

  @OneToMany(() => AcademicStructure, academicStructure => academicStructure.plan)
  subjects: AcademicStructure[];

  // Métodos auxiliares
  getPrerequisitesList(): string[] {
    return this.prerequisites ? this.prerequisites.split(',').map(p => p.trim()) : [];
  }

  setPrerequisitesList(prerequisites: string[]): void {
    this.prerequisites = prerequisites.join(', ');
  }

  isPlan(): boolean {
    return this.type === AcademicStructureType.PLAN;
  }

  isSubject(): boolean {
    return this.type === AcademicStructureType.SUBJECT;
  }

  isModule(): boolean {
    return this.type === AcademicStructureType.MODULE;
  }
}
