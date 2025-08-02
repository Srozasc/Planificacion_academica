import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ScheduleEvent } from './schedule-event.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { Bimestre } from '../../common/entities/bimestre.entity';

@Entity('event_teachers')
export class EventTeacher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'event_id' })
  eventId: number;

  @Column({ name: 'teacher_id' })
  teacherId: number;

  @Column({ name: 'id_bimestre', nullable: true, comment: 'ID del bimestre (FK a bimestres)' })
  idBimestre?: number;

  @ManyToOne(() => ScheduleEvent, event => event.eventTeachers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: ScheduleEvent;

  @ManyToOne(() => Teacher, teacher => teacher.eventTeachers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @ManyToOne(() => Bimestre, { nullable: true })
  @JoinColumn({ name: 'id_bimestre' })
  bimestre?: Bimestre;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}