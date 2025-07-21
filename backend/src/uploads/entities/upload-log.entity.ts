import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Bimestre } from '../../common/entities/bimestre.entity';
import { User } from '../../users/entities/user.entity';

@Entity('upload_logs')
@Index('idx_upload_date', ['uploadDate'])
@Index('idx_upload_type', ['uploadType'])
@Index('idx_status', ['status'])
@Index('idx_bimestre_id', ['bimestreId'])
export class UploadLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName: string;

  @Column({ name: 'upload_type', type: 'varchar', length: 50 })
  uploadType: string;

  @CreateDateColumn({ name: 'upload_date' })
  uploadDate: Date;

  @Column({ name: 'bimestre_id', type: 'int', nullable: true })
  bimestreId: number;

  @ManyToOne(() => Bimestre, { nullable: true })
  @JoinColumn({ name: 'bimestre_id' })
  bimestre: Bimestre;

  @Column({ 
    type: 'enum', 
    enum: ['Exitoso', 'Con errores', 'Error'],
    default: 'Exitoso'
  })
  status: 'Exitoso' | 'Con errores' | 'Error';

  @Column({ 
    name: 'approval_status',
    type: 'enum', 
    enum: ['Pendiente', 'Aprobado', 'Rechazado'],
    default: 'Pendiente'
  })
  approvalStatus: 'Pendiente' | 'Aprobado' | 'Rechazado';

  @Column({ name: 'approved_by', type: 'int', nullable: true })
  approvedByUserId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy: User;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ name: 'is_processed', type: 'boolean', default: false })
  isProcessed: boolean;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ name: 'total_records', type: 'int', default: 0 })
  totalRecords: number;

  @Column({ name: 'error_count', type: 'int', default: 0 })
  errorCount: number;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'error_details', type: 'text', nullable: true })
  errorDetails: string;
}