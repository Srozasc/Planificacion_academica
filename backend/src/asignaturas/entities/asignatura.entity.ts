import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Carrera } from '../../carreras/entities/carrera.entity';
import { Bimestre } from '../../common/entities/bimestre.entity';

@Entity('asignaturas')
export class Asignatura {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  carrera_id: number;

  @Column({ type: 'varchar', length: 20 })
  sigla: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'int', nullable: true })
  creditos: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  categoria_asignatura: string;

  @Column({ type: 'int' })
  bimestre_id: number;

  @CreateDateColumn()
  fecha_creacion: Date;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @ManyToOne(() => Carrera, carrera => carrera.asignaturas)
  @JoinColumn({ name: 'carrera_id' })
  carrera: Carrera;

  @ManyToOne(() => Bimestre)
  @JoinColumn({ name: 'bimestre_id' })
  bimestre: Bimestre;
}