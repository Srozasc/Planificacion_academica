import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('dol_aprobados')
@Index('IX_dol_aprobados_bimestre', ['id_bimestre'])
@Index('IX_dol_aprobados_sigla', ['sigla'])
@Index('IX_dol_aprobados_plan', ['plan'])
@Index('IX_dol_aprobados_fecha_aprobacion', ['fecha_aprobacion'])
@Index('IX_dol_aprobados_aprobado_por', ['aprobado_por'])
export class DolAprobados {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  plan: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  sigla: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  descripcion: string;

  @Column({ type: 'int', nullable: false })
  id_bimestre: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecha_aprobacion: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  aprobado_por: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecha_creacion: Date;

  @Column({ 
    type: 'datetime', 
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP'
  })
  fecha_actualizacion: Date;

  @Column({ type: 'boolean', default: true })
  activo: boolean;
}