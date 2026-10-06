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
import { EstadoCama } from '../maquina-estados-cama.js';

@Entity('habitaciones')
export class Habitacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  numero: string;

  @Column({ type: 'int' })
  piso: number;

  @Column({ type: 'nvarchar' })
  sector: string;
}

@Entity('camas')
export class Cama {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Habitacion)
  @JoinColumn({ name: 'habitacion_id' })
  habitacion: Relation<Habitacion>;

  @Column({ type: 'varchar' })
  codigo: string;

  @Column({ type: 'nvarchar' })
  estado: EstadoCama;

  /** Número de versión de la fila. Se usa para el bloqueo optimista. */
  @Column({ type: 'int' })
  version: number;
}

export type MotivoIngreso = 'PRE_QUIRURGICO' | 'INFECCION_RESPIRATORIA' | 'OTRO';

/**
 * Una fila de camas_historial es una INTERNACIÓN: qué paciente ocupó qué
 * cama, desde cuándo y hasta cuándo. Si fechaEgreso es null, sigue internado.
 */
@Entity('camas_historial')
export class Internacion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Cama)
  @JoinColumn({ name: 'cama_id' })
  cama: Relation<Cama>;

  @Column({ name: 'cama_id', type: 'int' })
  camaId: number;

  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'paciente_id' })
  paciente: Relation<Paciente>;

  @Column({ name: 'paciente_id', type: 'int' })
  pacienteId: number;

  @Column({ name: 'motivo_ingreso', type: 'nvarchar' })
  motivoIngreso: MotivoIngreso;

  @Column({ name: 'diagnostico_inicial', type: 'nvarchar', nullable: true })
  diagnosticoInicial: string | null;

  @CreateDateColumn({ name: 'fecha_ingreso', type: 'datetime2' })
  fechaIngreso: Date;

  @Column({ name: 'fecha_egreso', type: 'datetime2', nullable: true })
  fechaEgreso: Date | null;
}
