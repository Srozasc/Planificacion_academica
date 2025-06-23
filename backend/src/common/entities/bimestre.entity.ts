import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('bimestres')
export class Bimestre {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'date' })
  fechaInicio: Date;

  @Column({ type: 'date' })
  fechaFin: Date;

  @Column({ type: 'int' })
  anoAcademico: number;

  @Column({ type: 'int' })
  numeroBimestre: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Método helper para verificar si una fecha está dentro del bimestre
  contieneFecha(fecha: Date): boolean {
    return fecha >= this.fechaInicio && fecha <= this.fechaFin;
  }

  // Método helper para obtener la duración en días
  getDuracionDias(): number {
    const diffTime = Math.abs(this.fechaFin.getTime() - this.fechaInicio.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
