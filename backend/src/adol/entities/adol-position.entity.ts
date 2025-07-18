import {
  Entity,
  Column,
  Index,
} from 'typeorm';

@Entity('staging_adol_simple')
@Index('IX_staging_adol_simple_bimestre', ['id_bimestre'])
@Index('IX_staging_adol_simple_sigla', ['SIGLA'])
export class StagingAdolSimple {
  @Column({ type: 'varchar', length: 20, primary: true })
  SIGLA: string;

  @Column({ type: 'varchar', length: 500 })
  DESCRIPCION: string;

  @Column({ type: 'int', primary: true })
  id_bimestre: number;
}