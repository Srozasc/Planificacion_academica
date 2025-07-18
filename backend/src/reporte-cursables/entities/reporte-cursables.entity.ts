import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';

@Entity('staging_reporte_cursables')
@Index('IX_staging_reporte_cursables_bimestre', ['id_bimestre'])
@Index('IX_staging_reporte_cursables_rut', ['rut'])
@Index('IX_staging_reporte_cursables_sigla', ['sigla'])
export class StagingReporteCursables {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  rut: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  plan: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nivel: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sigla: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  asignatura: string;

  @Column({ type: 'int', nullable: true })
  id_bimestre: number;
}