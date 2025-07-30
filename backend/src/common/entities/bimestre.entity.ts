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

  @Column({ type: 'date', nullable: true })
  fechaPago1?: Date;

  @Column({ type: 'date', nullable: true })
  fechaPago2?: Date;

  // Nuevos campos para rangos de fechas de pago
  @Column({ type: 'date', nullable: true })
  fechaPago1Inicio?: Date;

  @Column({ type: 'date', nullable: true })
  fechaPago1Fin?: Date;

  @Column({ type: 'date', nullable: true })
  fechaPago2Inicio?: Date;

  @Column({ type: 'date', nullable: true })
  fechaPago2Fin?: Date;

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
    console.log(`[DEBUG] Comparando fechas en bimestre ${this.nombre}:`);
    console.log(`  - Fecha a verificar: ${fecha.toISOString()} (${fecha.toString()})`);
    
    // Asegurar que las fechas del bimestre sean objetos Date
    const fechaInicio = new Date(this.fechaInicio);
    const fechaFin = new Date(this.fechaFin);
    
    console.log(`  - Fecha inicio bimestre: ${fechaInicio.toISOString()} (${fechaInicio.toString()})`);
    console.log(`  - Fecha fin bimestre: ${fechaFin.toISOString()} (${fechaFin.toString()})`);
    
    // Normalizar todas las fechas a medianoche UTC para comparación justa
    const fechaNormalizada = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const inicioNormalizado = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate());
    const finNormalizado = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), fechaFin.getDate());
    
    console.log(`  - Fecha normalizada: ${fechaNormalizada.toISOString()}`);
    console.log(`  - Inicio normalizado: ${inicioNormalizado.toISOString()}`);
    console.log(`  - Fin normalizado: ${finNormalizado.toISOString()}`);
    
    const resultado = fechaNormalizada >= inicioNormalizado && fechaNormalizada <= finNormalizado;
    console.log(`  - Resultado: ${resultado}`);
    
    return resultado;
  }

  // Método helper para obtener la duración en días
  getDuracionDias(): number {
    const diffTime = Math.abs(this.fechaFin.getTime() - this.fechaInicio.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
