import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Ficha demográfica del paciente. */
@Entity('pacientes')
export class Paciente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  dni: string;

  @Column({ type: 'nvarchar' })
  nombre: string;

  @Column({ type: 'nvarchar' })
  apellido: string;

  /** Las columnas DATE se manejan como texto "AAAA-MM-DD". */
  @Column({ name: 'fecha_nacimiento', type: 'date' })
  fechaNacimiento: string;

  @Column({ type: 'char', nullable: true })
  sexo: string | null;

  @Column({ type: 'varchar', nullable: true })
  telefono: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'nvarchar', nullable: true })
  direccion: string | null;

  @CreateDateColumn({ name: 'creado_en', type: 'datetime2' })
  creadoEn: Date;
}
