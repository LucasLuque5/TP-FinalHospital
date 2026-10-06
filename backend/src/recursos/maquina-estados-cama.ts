import { UnprocessableEntityException } from '@nestjs/common';

/**
 * MÁQUINA DE ESTADOS DE LA CAMA - Épica 2 de Recursos
 * ------------------------------------------------------------------
 * A diferencia del turno (donde la consigna pide el patrón State con
 * clases), acá la máquina se modela con una TABLA DE TRANSICIONES:
 * para cada estado se anota qué acciones admite y a qué estado llevan.
 * Todo lo que no figura en la tabla está prohibido.
 *
 *   Libre --asignar--> Ocupada --alta--> En limpieza --higiene OK--> Libre
 *     |                                                               ^
 *     +--bloquear--> Bloqueada --desbloquear--------------------------+
 *
 * Así una cama nunca puede pasar "mágicamente" de Ocupada a Libre.
 */

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

/** Devuelve el estado al que pasa la cama, o lanza un error si la acción no está permitida. */
export function siguienteEstadoCama(actual: EstadoCama, accion: AccionCama): EstadoCama {
  const siguiente = TRANSICIONES[actual][accion];
  if (!siguiente) {
    throw new TransicionCamaInvalidaError(
      `No se puede ${accion} en una cama que está en estado "${actual}".`,
    );
  }
  return siguiente;
}
