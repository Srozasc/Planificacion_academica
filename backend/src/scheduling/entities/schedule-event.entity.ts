import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Bimestre } from '../../common/entities/bimestre.entity';
import { EventTeacher } from './event-teacher.entity';

@Entity('schedule_events')
export class ScheduleEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'datetime' })
  start_date: Date;

  @Column({ type: 'datetime' })
  end_date: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  teacher?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subject?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  room?: string;

  @Column({ type: 'int', nullable: true })
  students?: number;

  @Column({ type: 'varchar', length: 7, nullable: true })
  background_color?: string;

  @Column({ type: 'int', nullable: true })
  bimestre_id?: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relación con bimestre (opcional)
  @ManyToOne(() => Bimestre, { nullable: true })
  @JoinColumn({ name: 'bimestre_id' })
  bimestre?: Bimestre;

  // Relación con docentes a través de la tabla intermedia
  @OneToMany(() => EventTeacher, eventTeacher => eventTeacher.event)
  eventTeachers: EventTeacher[];

  // Método helper para verificar si el evento está en un rango de fechas
  isInRange(startDate: Date, endDate: Date): boolean {
    return this.start_date >= startDate && this.end_date <= endDate;
  }

  // Método helper para verificar si hay conflicto con otro evento
  conflictsWith(other: ScheduleEvent): boolean {
    return (
      this.start_date < other.end_date && 
      this.end_date > other.start_date
    );
  }

  // Método helper para obtener la duración en minutos
  getDurationMinutes(): number {
    return Math.floor((this.end_date.getTime() - this.start_date.getTime()) / 60000);
  }
}
