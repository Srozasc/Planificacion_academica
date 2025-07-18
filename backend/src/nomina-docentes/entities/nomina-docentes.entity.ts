import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';

@Entity('staging_nomina_docentes')
@Index('IX_staging_nomina_docentes_bimestre', ['id_bimestre'])
@Index('IX_staging_nomina_docentes_rut', ['rut_docente'])
export class StagingNominaDocentes {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  docente: string;

  @Column({ type: 'varchar', length: 50 })
  id_docente: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  rut_docente: string;

  @Column({ type: 'int' })
  id_bimestre: number;
}