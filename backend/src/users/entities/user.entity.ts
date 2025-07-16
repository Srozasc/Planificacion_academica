import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from '../../common/entities/role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'email_institucional', unique: true })
  emailInstitucional: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column()
  name: string;



  @Column({ nullable: true })
  telefono: string;

  @Column({ name: 'role_id' })
  roleId: number;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'role_expires_at', nullable: true })
  roleExpiresAt: Date;

  @Column({ name: 'previous_role_id', nullable: true })
  previousRoleId: number;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'previous_role_id' })
  previousRole: Role;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}