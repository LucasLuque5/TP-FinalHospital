/** Los cinco roles que pide el diseño del sistema. Coinciden con la tabla "roles". */
export enum NombreRol {
  Administrador = 'Administrador',
  Medico = 'Médico',
  Enfermero = 'Enfermero',
  Recepcionista = 'Recepcionista',
  Paciente = 'Paciente',
}

/** Datos del usuario que hizo la petición. Se obtienen del token JWT. */
export interface UsuarioActual {
  id: number;
  nombreUsuario: string;
  nombreCompleto: string;
  rol: NombreRol;
  /** Solo tiene valor cuando el rol es Paciente. */
  pacienteId: number | null;
}
