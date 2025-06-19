import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Role Entity - Moved to CommonModule to avoid cross-module dependencies
 * 
 * This entity represents user roles in the system and is used by:
 * - AuthModule: For role-based authentication
 * - UsersModule: For user-role associations
 */
@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, length: 100 })
    name: string;

    @Column({ nullable: true, length: 255 })
    description: string;

    @Column({ default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
