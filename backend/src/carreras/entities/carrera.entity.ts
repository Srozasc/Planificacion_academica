import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Asignatura } from '../../asignaturas/entities/asignatura.entity';
import { Bimestre } from '../../common/entities/bimestre.entity';

@Entity('carreras')
export class Carrera {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  codigo_plan: string;

  @Column({ type: 'varchar', length: 255 })
  nombre_carrera: string;

  @Column({ type: 'int' })
  bimestre_id: number;

  @CreateDateColumn()
  fecha_creacion: Date;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @ManyToOne(() => Bimestre)
  @JoinColumn({ name: 'bimestre_id' })
  bimestre: Bimestre;

  @OneToMany(() => Asignatura, asignatura => asignatura.carrera)
  asignaturas: Asignatura[];
}