import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('reporte_cursables_aprobados')
@Index('IX_reporte_cursables_bimestre', ['id_bimestre'])
@Index('IX_reporte_cursables_rut', ['rut'])
@Index('IX_reporte_cursables_sigla', ['sigla'])
@Index('IX_reporte_cursables_plan', ['plan'])
@Index('IX_reporte_cursables_nivel', ['nivel'])
@Index('uk_reporte_cursables_rut_sigla_bimestre', ['rut', 'sigla', 'id_bimestre'], { unique: true })
export class ReporteCursablesAprobados {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20, nullable: false })
  rut: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  plan: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nivel: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  sigla: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  asignatura: string;

  @Column({ type: 'int', nullable: false })
  id_bimestre: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  aprobado_por: string;

  @Column({ type: 'datetime', nullable: true })
  fecha_aprobacion: Date;

  @CreateDateColumn({ type: 'datetime' })
  fecha_creacion: Date;

  @UpdateDateColumn({ type: 'datetime' })
  fecha_actualizacion: Date;
}