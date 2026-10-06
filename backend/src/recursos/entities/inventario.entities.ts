import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';

@Entity('insumos')
export class Insumo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar' })
  nombre: string;

  @Column({ type: 'int' })
  stock: number;
}

/** Cada entrada o salida de stock queda registrada (trazabilidad). */
@Entity('movimientos_inventarios')
export class MovimientoInventario {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Insumo)
  @JoinColumn({ name: 'insumo_id' })
  insumo: Relation<Insumo>;

  @Column({ name: 'insumo_id', type: 'int' })
  insumoId: number;

  @Column({ type: 'nvarchar' })
  tipo: 'INGRESO' | 'EGRESO';

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'nvarchar' })
  motivo: string;

  /** ID del evento que originó el movimiento (ej. MedicacionAdministrada). */
  @Column({ name: 'evento_id', type: 'uniqueidentifier', nullable: true })
  eventoId: string | null;

  @Column({ name: 'usuario_id', type: 'int', nullable: true })
  usuarioId: number | null;

  @CreateDateColumn({ type: 'datetime2' })
  fecha: Date;
}
