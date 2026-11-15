export enum NombreRol {
  Administrador = 'Administrador',
  Medico = 'Médico',
  Enfermero = 'Enfermero',
  Recepcionista = 'Recepcionista',
  Paciente = 'Paciente',
}

export interface UsuarioActual {
  id: number;
  nombreUsuario: string;
  nombreCompleto: string;
  rol: NombreRol;
  pacienteId: number | null;
}
