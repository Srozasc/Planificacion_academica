import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Carrera } from '../../carreras/entities/carrera.entity';
import { Bimestre } from '../../common/entities/bimestre.entity';

@Entity('usuario_permisos_carrera')
export class UsuarioPermisoCarrera {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  usuario_id: number;

  @Column({ type: 'int' })
  carrera_id: number;

  @Column({ type: 'int' })
  bimestre_id: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_asignacion' })
  fecha_asignacion: Date;

  @ManyToOne(() => User, user => user.permisosCarrera)
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @ManyToOne(() => Carrera)
  @JoinColumn({ name: 'carrera_id' })
  carrera: Carrera;

  @ManyToOne(() => Bimestre)
  @JoinColumn({ name: 'bimestre_id' })
  bimestre: Bimestre;
}