import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Usuario } from '../../iam/entities/usuario.entity.js';

/**
 * Entidades que forman la historia clínica de un paciente.
 * Todas guardan el paciente_id para saber a quién pertenecen.
 */

@Entity('alergias')
export class Alergia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'paciente_id', type: 'int' })
  pacienteId: number;

  @Column({ type: 'nvarchar' })
  sustancia: string;

  @Column({ type: 'nvarchar' })
  severidad: 'Leve' | 'Moderada' | 'Grave';

  @Column({ type: 'nvarchar', nullable: true })
  observaciones: string | null;

  @CreateDateColumn({ name: 'registrado_en', type: 'datetime2' })
  registradoEn: Date;
}

@Entity('antecedentes_familiares')
export class AntecedenteFamiliar {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'paciente_id', type: 'int' })
  pacienteId: number;

  @Column({ type: 'nvarchar' })
  parentesco: string;

  @Column({ type: 'nvarchar' })
  enfermedad: string;

  @Column({ type: 'nvarchar', nullable: true })
  observaciones: string | null;

  @CreateDateColumn({ name: 'registrado_en', type: 'datetime2' })
  registradoEn: Date;
}

/** Evolución médica: una vez escrita NO se modifica ni se borra (es inmutable). */
@Entity('evoluciones_medicas')
export class EvolucionMedica {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'paciente_id', type: 'int' })
  pacienteId: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'medico_id' })
  medico: Relation<Usuario>;

  @Column({ type: 'nvarchar' })
  descripcion: string;

  @CreateDateColumn({ name: 'registrado_en', type: 'datetime2' })
  registradoEn: Date;
}

@Entity('estudios')
export class Estudio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'paciente_id', type: 'int' })
  pacienteId: number;

  @Column({ type: 'nvarchar' })
  tipo: string;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'nvarchar' })
  informe: string;
}
