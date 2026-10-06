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
import { Insumo } from '../../recursos/entities/inventario.entities.js';
import { transformadorDecimal } from '../../shared/utilidades.js';
import type { Pagador } from '../estrategias/estrategias-cobertura.js';

const dinero = { type: 'decimal', precision: 12, scale: 2, transformer: transformadorDecimal } as const;

@Entity('obras_sociales')
export class ObraSocial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar' })
  nombre: string;

  @Column({ type: 'nvarchar' })
  tipo: 'PUBLICA' | 'PREPAGA';

  @Column({ name: 'copago_fijo', ...dinero })
  copagoFijo: number;
}

/** Vincula un paciente con su obra social. Sin fila vigente = Particular. */
@Entity('coberturas_pacientes')
export class CoberturaPaciente {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'paciente_id' })
  paciente: Relation<Paciente>;

  @Column({ name: 'paciente_id', type: 'int' })
  pacienteId: number;

  @ManyToOne(() => ObraSocial)
  @JoinColumn({ name: 'obra_social_id' })
  obraSocial: Relation<ObraSocial>;

  @Column({ name: 'obra_social_id', type: 'int' })
  obraSocialId: number;

  @Column({ name: 'numero_afiliado', type: 'varchar' })
  numeroAfiliado: string;

  @Column({ type: 'bit' })
  vigente: boolean;
}

/** Nomenclador: prestaciones con su valor base. */
@Entity('prestaciones')
export class Prestacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  codigo: string;

  @Column({ type: 'nvarchar' })
  nombre: string;

  @Column({ name: 'valor_base', ...dinero })
  valorBase: number;
}

/** Lista de precios de insumos. vigenteHasta null = precio vigente. */
@Entity('precios_insumos')
export class PrecioInsumo {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Insumo)
  @JoinColumn({ name: 'insumo_id' })
  insumo: Relation<Insumo>;

  @Column({ name: 'insumo_id', type: 'int' })
  insumoId: number;

  @Column({ name: 'precio_unitario', ...dinero })
  precioUnitario: number;

  @Column({ name: 'vigente_desde', type: 'date' })
  vigenteDesde: string;

  @Column({ name: 'vigente_hasta', type: 'date', nullable: true })
  vigenteHasta: string | null;
}

@Entity('facturas')
export class Factura {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'paciente_id' })
  paciente: Relation<Paciente>;

  @Column({ name: 'paciente_id', type: 'int' })
  pacienteId: number;

  @Column({ name: 'internacion_id', type: 'int', nullable: true })
  internacionId: number | null;

  /** PRESTACION = una atención puntual. ESTADIA = cuenta de gastos de una internación. */
  @Column({ type: 'nvarchar' })
  tipo: 'PRESTACION' | 'ESTADIA';

  @Column({ type: 'nvarchar' })
  estado: 'Abierta' | 'Cerrada';

  @OneToMany(() => FacturaItem, (item) => item.factura, { cascade: ['insert'] })
  items: Relation<FacturaItem>[];

  @CreateDateColumn({ name: 'creado_en', type: 'datetime2' })
  creadoEn: Date;

  @Column({ name: 'cerrada_en', type: 'datetime2', nullable: true })
  cerradaEn: Date | null;
}

@Entity('facturas_items')
export class FacturaItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Factura, (factura) => factura.items)
  @JoinColumn({ name: 'factura_id' })
  factura: Relation<Factura>;

  @Column({ name: 'factura_id', type: 'int' })
  facturaId: number;

  @Column({ type: 'nvarchar' })
  concepto: string;

  @Column({ type: 'nvarchar' })
  descripcion: string;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ name: 'precio_unitario', ...dinero })
  precioUnitario: number;

  @Column(dinero)
  importe: number;

  @Column({ name: 'a_cargo_de', type: 'nvarchar' })
  aCargoDe: Pagador;

  @ManyToOne(() => ObraSocial, { nullable: true })
  @JoinColumn({ name: 'obra_social_id' })
  obraSocial: Relation<ObraSocial> | null;

  @Column({ name: 'obra_social_id', type: 'int', nullable: true })
  obraSocialId: number | null;

  /** ID del evento que originó el cargo (trazabilidad de auditoría). */
  @Column({ name: 'evento_id', type: 'uniqueidentifier', nullable: true })
  eventoId: string | null;

  @CreateDateColumn({ name: 'creado_en', type: 'datetime2' })
  creadoEn: Date;
}
