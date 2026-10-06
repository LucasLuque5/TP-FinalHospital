import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Paciente } from '../../hce/entities/paciente.entity.js';

/**
 * Niveles de triaje. La consigna solo nombra el nivel 1 ("Riesgo Vital",
 * Código Rojo); el resto sigue la escala estándar de 5 colores.
 * Cuanto MENOR es el número, MAYOR es la urgencia.
 */
export const NIVELES_TRIAJE: Record<number, { nombre: string; color: string }> = {
  1: { nombre: 'Riesgo Vital', color: 'Rojo' },
  2: { nombre: 'Emergencia', color: 'Naranja' },
  3: { nombre: 'Urgencia', color: 'Amarillo' },
  4: { nombre: 'Urgencia menor', color: 'Verde' },
  5: { nombre: 'No urgente', color: 'Azul' },
};

@Entity('triajes')
export class Triaje {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'paciente_id' })
  paciente: Relation<Paciente>;

  @Column({ name: 'paciente_id', type: 'int' })
  pacienteId: number;

  @Column({ name: 'enfermero_id', type: 'int' })
  enfermeroId: number;

  @Column({ type: 'tinyint' })
  nivel: number;

  @Column({ type: 'nvarchar' })
  motivo: string;

  @Column({ type: 'nvarchar' })
  estado: 'En espera' | 'Atendido';

  @CreateDateColumn({ name: 'ingreso_en', type: 'datetime2' })
  ingresoEn: Date;

  @Column({ name: 'atendido_en', type: 'datetime2', nullable: true })
  atendidoEn: Date | null;
}
