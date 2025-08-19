import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('staging_optativos')
export class StagingOptativos {
  @PrimaryGeneratedColumn()
  id: number;

  // Campos del archivo Excel
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

  @Column({ type: 'int', nullable: false, default: 0, comment: 'Número de horas de la asignatura' })
  horas: number;

  // Campo de control de bimestre
  @Column({ type: 'int', nullable: false, comment: 'ID del bimestre al que pertenece' })
  id_bimestre: number;

  // Campos de auditoría y control
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ 
    type: 'timestamp', 
    default: () => 'CURRENT_TIMESTAMP', 
    onUpdate: 'CURRENT_TIMESTAMP' 
  })
  updated_at: Date;

  @Column({ 
    type: 'enum', 
    enum: ['pending', 'processed', 'error'], 
    default: 'pending',
    comment: 'Estado del procesamiento'
  })
  status: 'pending' | 'processed' | 'error';

  @Column({ type: 'text', nullable: true, comment: 'Mensaje de error si el procesamiento falla' })
  error_message: string;

  @Column({ type: 'timestamp', nullable: true, comment: 'Fecha y hora de procesamiento' })
  processed_at: Date;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: 'Usuario que procesó el registro' })
  processed_by: string;
}