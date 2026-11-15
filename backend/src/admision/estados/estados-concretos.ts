import {
  EstadoTurno,
  NombreEstadoTurno,
  TransicionInvalidaError,
  type TurnoConEstado,
} from './estado-turno.js';

export class EstadoDisponible extends EstadoTurno {
  readonly nombre = NombreEstadoTurno.Disponible;

  override reservar(turno: TurnoConEstado): void {
    turno.estado = NombreEstadoTurno.Programado;
  }
}

export class EstadoProgramado extends EstadoTurno {
  readonly nombre = NombreEstadoTurno.Programado;

  override confirmar(turno: TurnoConEstado): void {
    turno.estado = NombreEstadoTurno.Confirmado;
  }

  override cancelar(turno: TurnoConEstado): void {
    turno.estado = NombreEstadoTurno.Cancelado;
  }
}

export class EstadoConfirmado extends EstadoTurno {
  readonly nombre = NombreEstadoTurno.Confirmado;

  override registrarLlegada(turno: TurnoConEstado): void {
    turno.estado = NombreEstadoTurno.EnSalaDeEspera;
  }

  override cancelar(turno: TurnoConEstado): void {
    turno.estado = NombreEstadoTurno.Cancelado;
  }
}

export class EstadoEnSalaDeEspera extends EstadoTurno {
  readonly nombre = NombreEstadoTurno.EnSalaDeEspera;

  override atender(turno: TurnoConEstado): void {
    turno.estado = NombreEstadoTurno.Atendido;
  }

  override cancelar(turno: TurnoConEstado): void {
    turno.estado = NombreEstadoTurno.Cancelado;
  }
}

export class EstadoAtendido extends EstadoTurno {
  readonly nombre = NombreEstadoTurno.Atendido;
}

export class EstadoCancelado extends EstadoTurno {
  readonly nombre = NombreEstadoTurno.Cancelado;

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

export function obtenerEstado(nombre: NombreEstadoTurno): EstadoTurno {
  return ESTADOS[nombre];
}
