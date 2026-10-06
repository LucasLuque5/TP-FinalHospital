import {
  EstadoTurno,
  NombreEstadoTurno,
  TransicionInvalidaError,
  type TurnoConEstado,
} from './estado-turno.js';

/**
 * Los estados concretos. Flujo permitido:
 *
 *   Disponible -> Programado -> Confirmado -> En Sala de Espera -> Atendido
 *                     |             |                 |
 *                     +-------------+-----------------+--> Cancelado
 *
 * "Atendido" y "Cancelado" son estados finales: no permiten nada.
 */

/** Horario libre en la agenda. Solo se puede reservar. */
export class EstadoDisponible extends EstadoTurno {
  readonly nombre = NombreEstadoTurno.Disponible;

  override reservar(turno: TurnoConEstado): void {
    turno.estado = NombreEstadoTurno.Programado;
  }
}

/** Al finalizar la reserva inicial. */
export class EstadoProgramado extends EstadoTurno {
  readonly nombre = NombreEstadoTurno.Programado;

  override confirmar(turno: TurnoConEstado): void {
    turno.estado = NombreEstadoTurno.Confirmado;
  }

  override cancelar(turno: TurnoConEstado): void {
    turno.estado = NombreEstadoTurno.Cancelado;
  }
}

/** Cuando el paciente revalida su intención de asistir. */
export class EstadoConfirmado extends EstadoTurno {
  readonly nombre = NombreEstadoTurno.Confirmado;

  override registrarLlegada(turno: TurnoConEstado): void {
    turno.estado = NombreEstadoTurno.EnSalaDeEspera;
  }

  override cancelar(turno: TurnoConEstado): void {
    turno.estado = NombreEstadoTurno.Cancelado;
  }
}

/** Al registrarse físicamente en la recepción del hospital. */
export class EstadoEnSalaDeEspera extends EstadoTurno {
  readonly nombre = NombreEstadoTurno.EnSalaDeEspera;

  override atender(turno: TurnoConEstado): void {
    turno.estado = NombreEstadoTurno.Atendido;
  }

  override cancelar(turno: TurnoConEstado): void {
    turno.estado = NombreEstadoTurno.Cancelado;
  }
}

/** Al concluir la consulta. Estado final: hereda todos los rechazos. */
export class EstadoAtendido extends EstadoTurno {
  readonly nombre = NombreEstadoTurno.Atendido;
}

/** Si el paciente o la clínica anulan la cita. Estado final. */
export class EstadoCancelado extends EstadoTurno {
  readonly nombre = NombreEstadoTurno.Cancelado;

  // Mensaje específico que pide la HU 2.1 (Escenario 2).
  protected override rechazar(): never {
    throw new TransicionInvalidaError(
      'Un turno cancelado no puede avanzar en el flujo de atención.',
    );
  }
}

const ESTADOS: Record<NombreEstadoTurno, EstadoTurno> = {
  [NombreEstadoTurno.Disponible]: new EstadoDisponible(),
  [NombreEstadoTurno.Programado]: new EstadoProgramado(),
  [NombreEstadoTurno.Confirmado]: new EstadoConfirmado(),
  [NombreEstadoTurno.EnSalaDeEspera]: new EstadoEnSalaDeEspera(),
  [NombreEstadoTurno.Atendido]: new EstadoAtendido(),
  [NombreEstadoTurno.Cancelado]: new EstadoCancelado(),
};

/**
 * En la base de datos el estado se guarda como texto. Esta función
 * devuelve el OBJETO estado que corresponde a ese texto.
 * Uso:  obtenerEstado(turno.estado).confirmar(turno);
 */
export function obtenerEstado(nombre: NombreEstadoTurno): EstadoTurno {
  return ESTADOS[nombre];
}
