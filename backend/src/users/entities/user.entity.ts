import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { Role } from '../../auth/entities/role.entity';

@Entity('users')
@Index(['email_institucional'])
@Index(['role_id'])
@Index(['is_active'])
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, length: 255 })
    email_institucional: string;

    @Column({ nullable: true, length: 255 })
    password_hash: string;

    @Column({ length: 255 })
    name: string;

    @Column()
    role_id: number;    @Column({ default: true })
    is_active: boolean;    @Column({ nullable: true, length: 20 })
    telefono: string;

    @Column({ nullable: true, length: 50 })
    documento_identificacion: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;

    @ManyToOne(() => Role)
    @JoinColumn({ name: 'role_id' })
    role: Role;
}
