import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Paciente } from '../../hce/entities/paciente.entity.js';
import { Usuario } from '../../iam/entities/usuario.entity.js';
import { Insumo } from '../../recursos/entities/inventario.entities.js';
import { transformadorDecimal } from '../../shared/utilidades.js';

@Entity('signos_vitales')
export class SignoVital {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'internacion_id', type: 'int' })
  internacionId: number;

  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'paciente_id' })
  paciente: Relation<Paciente>;

  @Column({ name: 'paciente_id', type: 'int' })
  pacienteId: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'enfermero_id' })
  enfermero: Relation<Usuario>;

  @Column({ name: 'enfermero_id', type: 'int' })
  enfermeroId: number;

  @Column({ name: 'presion_sistolica', type: 'int' })
  presionSistolica: number;

  @Column({ name: 'presion_diastolica', type: 'int' })
  presionDiastolica: number;

  @Column({ name: 'frecuencia_cardiaca', type: 'int' })
  frecuenciaCardiaca: number;

  @Column({ type: 'decimal', precision: 4, scale: 1, transformer: transformadorDecimal })
  temperatura: number;

  /** true = el frontend lo muestra destacado en rojo. */
  @Column({ name: 'fuera_de_rango', type: 'bit' })
  fueraDeRango: boolean;

  /** Estampa de tiempo: la pone la base de datos al insertar. */
  @CreateDateColumn({ name: 'registrado_en', type: 'datetime2' })
  registradoEn: Date;
}

@Entity('notas_enfermeria')
export class NotaEnfermeria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'paciente_id', type: 'int' })
  pacienteId: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'enfermero_id' })
  enfermero: Relation<Usuario>;

  @Column({ name: 'enfermero_id', type: 'int' })
  enfermeroId: number;

  @Column({ type: 'nvarchar' })
  texto: string;

  /** true = la generó el sistema; false = la escribió el enfermero. */
  @Column({ type: 'bit' })
  automatica: boolean;

  @CreateDateColumn({ name: 'creado_en', type: 'datetime2' })
  creadoEn: Date;
}

@Entity('indicaciones_medicas')
export class IndicacionMedica {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'paciente_id' })
  paciente: Relation<Paciente>;

  @Column({ name: 'paciente_id', type: 'int' })
  pacienteId: number;

  @Column({ name: 'medico_id', type: 'int' })
  medicoId: number;

  @ManyToOne(() => Insumo)
  @JoinColumn({ name: 'insumo_id' })
  insumo: Relation<Insumo>;

  @Column({ name: 'insumo_id', type: 'int' })
  insumoId: number;

  @Column({ type: 'nvarchar' })
  descripcion: string;

  @Column({ name: 'frecuencia_horas', type: 'int' })
  frecuenciaHoras: number;

  @Column({ type: 'bit' })
  activa: boolean;

  @CreateDateColumn({ name: 'creado_en', type: 'datetime2' })
  creadoEn: Date;
}

/** Una dosis programada de una indicación. */
@Entity('administraciones_medicacion')
export class AdministracionMedicacion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => IndicacionMedica)
  @JoinColumn({ name: 'indicacion_id' })
  indicacion: Relation<IndicacionMedica>;

  @Column({ name: 'indicacion_id', type: 'int' })
  indicacionId: number;

  @Column({ name: 'hora_programada', type: 'datetime2' })
  horaProgramada: Date;

  @Column({ type: 'nvarchar' })
  estado: 'Pendiente' | 'Administrada';

  @Column({ name: 'administrada_en', type: 'datetime2', nullable: true })
  administradaEn: Date | null;

  /** Usuario del enfermero que aplicó la dosis. */
  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'enfermero_id' })
  enfermero: Relation<Usuario> | null;

  @Column({ name: 'enfermero_id', type: 'int', nullable: true })
  enfermeroId: number | null;

  @Column({ name: 'evento_id', type: 'uniqueidentifier', nullable: true })
  eventoId: string | null;
}

@Entity('protocolos')
export class Protocolo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'internacion_id', type: 'int' })
  internacionId: number;

  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'paciente_id' })
  paciente: Relation<Paciente>;

  @Column({ name: 'paciente_id', type: 'int' })
  pacienteId: number;

  @Column({ type: 'nvarchar' })
  nombre: string;

  @OneToMany(() => ProtocoloTarea, (tarea) => tarea.protocolo, { cascade: ['insert'] })
  tareas: Relation<ProtocoloTarea>[];

  @CreateDateColumn({ name: 'creado_en', type: 'datetime2' })
  creadoEn: Date;
}

@Entity('protocolos_tareas')
export class ProtocoloTarea {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Protocolo, (protocolo) => protocolo.tareas)
  @JoinColumn({ name: 'protocolo_id' })
  protocolo: Relation<Protocolo>;

  @Column({ type: 'int' })
  orden: number;

  @Column({ type: 'nvarchar' })
  descripcion: string;

  @Column({ type: 'bit' })
  completada: boolean;

  @Column({ name: 'completada_por', type: 'int', nullable: true })
  completadaPor: number | null;

  @Column({ name: 'completada_en', type: 'datetime2', nullable: true })
  completadaEn: Date | null;
}
