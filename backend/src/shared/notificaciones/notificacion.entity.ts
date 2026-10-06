import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn()
  id: number;

  /** Nombre del rol que debe ver la notificación (ej. "Médico"). */
  @Column({ name: 'rol_destino', type: 'nvarchar' })
  rolDestino: string;

  /** Si tiene valor, solo la ve ese usuario (ej. el médico del turno). */
  @Column({ name: 'usuario_destino_id', type: 'int', nullable: true })
  usuarioDestinoId: number | null;

  @Column({ type: 'nvarchar' })
  prioridad: 'NORMAL' | 'ALTA';

  @Column({ type: 'nvarchar' })
  titulo: string;

  @Column({ type: 'nvarchar' })
  mensaje: string;

  @CreateDateColumn({ name: 'creado_en', type: 'datetime2' })
  creadoEn: Date;
}
