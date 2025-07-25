import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Bimestre } from '../../common/entities/bimestre.entity';

@Entity('usuario_permisos_categoria')
export class UsuarioPermisoCategoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  usuario_id: number;

  @Column({ type: 'varchar', length: 50 })
  categoria: string;

  @Column({ type: 'int' })
  bimestre_id: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn()
  fecha_creacion: Date;

  @ManyToOne(() => User, user => user.permisosCategoria)
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @ManyToOne(() => Bimestre)
  @JoinColumn({ name: 'bimestre_id' })
  bimestre: Bimestre;
}