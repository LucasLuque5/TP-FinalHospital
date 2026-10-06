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
import { Usuario } from '../../iam/entities/usuario.entity.js';
import { NombreEstadoTurno } from '../estados/estado-turno.js';

@Entity('turnos')
export class Turno {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'medico_id' })
  medico: Relation<Usuario>;

  @Column({ name: 'medico_id', type: 'int' })
  medicoId: number;

  @ManyToOne(() => Paciente, { nullable: true })
  @JoinColumn({ name: 'paciente_id' })
  paciente: Relation<Paciente> | null;

  @Column({ name: 'paciente_id', type: 'int', nullable: true })
  pacienteId: number | null;

  @Column({ name: 'fecha_hora_inicio', type: 'datetime2' })
  fechaHoraInicio: Date;

  @Column({ name: 'duracion_minutos', type: 'int' })
  duracionMinutos: number;

  @Column({ type: 'nvarchar' })
  estado: NombreEstadoTurno;

  @Column({ name: 'es_entreturno', type: 'bit' })
  esEntreturno: boolean;

  /** true = al turno se le recortó tiempo por un entreturno (etiqueta visual). */
  @Column({ name: 'tiempo_reducido', type: 'bit' })
  tiempoReducido: boolean;

  @CreateDateColumn({ name: 'creado_en', type: 'datetime2' })
  creadoEn: Date;
}
