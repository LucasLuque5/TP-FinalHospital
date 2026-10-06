import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Rol } from './rol.entity.js';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'nombre_usuario', type: 'varchar' })
  nombreUsuario: string;

  /** select: false => esta columna NO se trae en las consultas salvo que se pida. */
  @Column({ name: 'password_hash', type: 'varchar', select: false })
  passwordHash: string;

  @Column({ type: 'nvarchar' })
  nombre: string;

  @Column({ type: 'nvarchar' })
  apellido: string;

  @ManyToOne(() => Rol, { eager: true })
  @JoinColumn({ name: 'rol_id' })
  rol: Relation<Rol>;

  @Column({ name: 'paciente_id', type: 'int', nullable: true })
  pacienteId: number | null;

  @Column({ type: 'bit' })
  activo: boolean;

  @CreateDateColumn({ name: 'creado_en', type: 'datetime2' })
  creadoEn: Date;
}
