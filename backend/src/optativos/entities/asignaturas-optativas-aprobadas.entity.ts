import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('asignaturas_optativas_aprobadas')
@Index('IX_asignaturas_optativas_aprobadas_bimestre', ['id_bimestre'])
@Index('IX_asignaturas_optativas_aprobadas_plan', ['plan'])
@Index('IX_asignaturas_optativas_aprobadas_asignatura', ['asignatura'])
@Index('IX_asignaturas_optativas_aprobadas_nivel', ['nivel'])
@Index('IX_asignaturas_optativas_aprobadas_jornada', ['jornada'])
@Index('IX_asignaturas_optativas_aprobadas_fecha_aprobacion', ['fecha_aprobacion'])
@Index('IX_asignaturas_optativas_aprobadas_aprobado_por', ['aprobado_por'])
@Index('IX_asignaturas_optativas_plan_bimestre', ['plan', 'id_bimestre'])
@Index('IX_asignaturas_optativas_asignatura_bimestre', ['asignatura', 'id_bimestre'])
@Index('IX_asignaturas_optativas_nivel_jornada', ['nivel', 'jornada'])
@Index('UK_asignaturas_optativas_unique', ['plan', 'asignatura', 'id_bimestre'], { unique: true })
export class AsignaturasOptativasAprobadas {
  @PrimaryGeneratedColumn()
  id: number;

  // Campos principales del archivo Excel
  @Column({ type: 'varchar', length: 20, nullable: false, comment: 'Código del plan de estudios' })
  plan: string;

  @Column({ type: 'varchar', length: 255, nullable: false, comment: 'Descripción del plan de estudios' })
  descripcion_plan: string;

  @Column({ type: 'varchar', length: 10, nullable: false, comment: 'Nivel académico' })
  nivel: string;

  @Column({ type: 'varchar', length: 50, nullable: false, comment: 'Grupo de asignatura' })
  grupo_asignatura: string;

  @Column({ type: 'varchar', length: 50, nullable: false, comment: 'Jornada (A DISTANCIA, DIURNA, etc.)' })
  jornada: string;

  @Column({ type: 'varchar', length: 20, nullable: false, comment: 'Código de la asignatura' })
  asignatura: string;

  @Column({ type: 'varchar', length: 255, nullable: false, comment: 'Descripción de la asignatura' })
  descripcion_asignatura: string;

  @Column({ type: 'int', nullable: false, comment: 'Número de vacantes disponibles' })
  vacantes: number;

  // Campo de control de bimestre
  @Column({ type: 'int', nullable: false, comment: 'ID del bimestre al que pertenece' })
  id_bimestre: number;

  // Campos de auditoría
  @Column({ 
    type: 'datetime', 
    nullable: false, 
    default: () => 'CURRENT_TIMESTAMP',
    comment: 'Fecha de aprobación' 
  })
  fecha_aprobacion: Date;

  @Column({ 
    type: 'varchar', 
    length: 255, 
    nullable: true, 
    comment: 'Email del usuario que aprobó' 
  })
  aprobado_por: string;

  @CreateDateColumn({ 
    type: 'datetime', 
    default: () => 'CURRENT_TIMESTAMP',
    comment: 'Fecha de creación del registro' 
  })
  fecha_creacion: Date;

  @UpdateDateColumn({ 
    type: 'datetime', 
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    comment: 'Fecha de última actualización' 
  })
  fecha_actualizacion: Date;

  @Column({ 
    type: 'boolean', 
    default: true, 
    comment: 'Indica si el registro está activo' 
  })
  activo: boolean;
}