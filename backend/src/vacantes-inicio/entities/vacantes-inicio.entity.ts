import {
  Entity,
  Column,
  Index,
} from 'typeorm';

@Entity('staging_vacantes_inicio')
@Index('IX_staging_vacantes_inicio_bimestre', ['id_bimestre'])
@Index('IX_staging_vacantes_inicio_sigla', ['sigla_asignatura'])
export class StagingVacantesInicio {
  @Column({ type: 'varchar', length: 50, primary: true })
  codigo_plan: string;

  @Column({ type: 'varchar', length: 255 })
  carrera: string;

  @Column({ type: 'varchar', length: 20, primary: true })
  sigla_asignatura: string;

  @Column({ type: 'varchar', length: 255 })
  asignatura: string;

  @Column({ type: 'varchar', length: 50 })
  nivel: string;

  @Column({ type: 'int' })
  creditos: number;

  @Column({ type: 'int' })
  vacantes: number;

  @Column({ type: 'int', primary: true })
  id_bimestre: number;
}