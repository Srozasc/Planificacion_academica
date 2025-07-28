import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('academic_structures')
export class AcademicStructure {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  code: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  level: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  acronym: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  course: string;

  @Column({ type: 'int', nullable: true })
  credits: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'int', nullable: true })
  hours: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  duration: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  clplestud: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  school_code: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  school_prog: string;

  @Column({ type: 'int', nullable: true })
  id_bimestre: number;

  @Column({ type: 'tinyint', default: 1 })
  is_active: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}