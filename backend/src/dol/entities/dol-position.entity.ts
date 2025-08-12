import {
  Entity,
  Column,
  PrimaryColumn,
} from 'typeorm';

@Entity('staging_dol')
export class StagingDol {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  sigla: string;

  @PrimaryColumn({ type: 'varchar', length: 50 })
  plan: string;

  @Column({ type: 'varchar', length: 255 })
  descripcion: string;

  @Column({ type: 'int' })
  id_bimestre: number;
}