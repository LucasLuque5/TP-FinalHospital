import { UnprocessableEntityException } from '@nestjs/common';

export enum EstadoCama {
  Libre = 'Libre',
  Ocupada = 'Ocupada',
  EnLimpieza = 'En limpieza',
  Bloqueada = 'Bloqueada',
}

export enum AccionCama {
  AsignarPaciente = 'asignar un paciente',
  LiberarPorAlta = 'liberar por alta',
  ConfirmarLimpieza = 'confirmar la limpieza',
  Bloquear = 'bloquear por mantenimiento',
  Desbloquear = 'desbloquear',
}

const TRANSICIONES: Record<EstadoCama, Partial<Record<AccionCama, EstadoCama>>> = {
  [EstadoCama.Libre]: {
    [AccionCama.AsignarPaciente]: EstadoCama.Ocupada,
    [AccionCama.Bloquear]: EstadoCama.Bloqueada,
  },
  [EstadoCama.Ocupada]: {
    [AccionCama.LiberarPorAlta]: EstadoCama.EnLimpieza,
  },
  [EstadoCama.EnLimpieza]: {
    [AccionCama.ConfirmarLimpieza]: EstadoCama.Libre,
  },
  [EstadoCama.Bloqueada]: {
    [AccionCama.Desbloquear]: EstadoCama.Libre,
  },
};

export class TransicionCamaInvalidaError extends UnprocessableEntityException {}

export function siguienteEstadoCama(actual: EstadoCama, accion: AccionCama): EstadoCama {
  const siguiente = TRANSICIONES[actual][accion];
  if (!siguiente) {
    throw new TransicionCamaInvalidaError(
      `No se puede ${accion} en una cama que está en estado "${actual}".`,
    );
  }
  return siguiente;
}
