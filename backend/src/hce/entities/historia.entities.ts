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
