import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';

@Entity('staging_estructura_academica')
@Index('IX_staging_estructura_academica_bimestre', ['id_bimestre'])
@Index('IX_staging_estructura_academica_sigla', ['sigla'])
export class StagingEstructuraAcademica {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  plan: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  carrera: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nivel: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sigla: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  asignatura: string;

  @Column({ type: 'int', nullable: true })
  creditos: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  categoria: string;

  @Column({ type: 'int', nullable: true })
  horas: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  duracion_carrera: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  clplestud: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  codigo_escuela: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  escuela_programa: string;

  @Column({ type: 'int', nullable: true })
  id_bimestre: number;
}