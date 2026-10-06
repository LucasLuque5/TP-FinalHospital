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

/** Cola de pacientes en espera (standby) para un médico y un día. */
@Entity('lista_espera')
export class ListaEspera {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'medico_id' })
  medico: Relation<Usuario>;

  @Column({ name: 'medico_id', type: 'int' })
  medicoId: number;

  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'paciente_id' })
  paciente: Relation<Paciente>;

  @Column({ name: 'paciente_id', type: 'int' })
  pacienteId: number;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'nvarchar' })
  estado: 'En espera' | 'Asignado';

  @Column({ name: 'turno_asignado_id', type: 'int', nullable: true })
  turnoAsignadoId: number | null;

  @CreateDateColumn({ name: 'creado_en', type: 'datetime2' })
  creadoEn: Date;
}
