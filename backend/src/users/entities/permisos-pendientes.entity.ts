import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Bimestre } from '../../common/entities/bimestre.entity';

@Entity('permisos_pendientes')
export class PermisosPendientes {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_mail', length: 255 })
  usuarioMail: string;

  @Column({ name: 'usuario_nombre', length: 255, nullable: true })
  usuarioNombre: string;

  @Column({ length: 255, nullable: true })
  cargo: string;

  @Column({ name: 'permiso_carrera_codigo', length: 50, nullable: true })
  permisoCarreraCodigo: string;

  @Column({ name: 'tipo_rol', length: 50, nullable: true })
  tipoRol: string;

  @Column({ name: 'permiso_categoria', length: 50, nullable: true })
  permisoCategoria: string;

  @Column({ name: 'fecha_expiracion', type: 'date', nullable: true })
  fechaExpiracion: Date;

  @Column({ type: 'int' })
  bimestre_id: number;

  @Column({
    type: 'enum',
    enum: ['PENDIENTE', 'PROCESADO', 'ERROR'],
    default: 'PENDIENTE'
  })
  estado: 'PENDIENTE' | 'PROCESADO' | 'ERROR';

  @Column({ name: 'mensaje_error', type: 'text', nullable: true })
  mensajeError: string;

  @Column({ name: 'intentos_procesamiento', default: 0 })
  intentosProcesamiento: number;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @Column({ name: 'fecha_procesado', type: 'timestamp', nullable: true })
  fechaProcesado: Date;

  @ManyToOne(() => Bimestre)
  @JoinColumn({ name: 'bimestre_id' })
  bimestre: Bimestre;
}