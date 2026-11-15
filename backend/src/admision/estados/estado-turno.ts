import { UnprocessableEntityException } from '@nestjs/common';

export enum NombreEstadoTurno {
  Disponible = 'Disponible',
  Programado = 'Programado',
  Confirmado = 'Confirmado',
  EnSalaDeEspera = 'En Sala de Espera',
  Atendido = 'Atendido',
  Cancelado = 'Cancelado',
}

export interface TurnoConEstado {
  estado: NombreEstadoTurno;
}

export class TransicionInvalidaError extends UnprocessableEntityException {}

export abstract class EstadoTurno {
  abstract readonly nombre: NombreEstadoTurno;

  reservar(_turno: TurnoConEstado): void {
    this.rechazar('reservar');
  }

  confirmar(_turno: TurnoConEstado): void {
    this.rechazar('confirmar');
  }

  registrarLlegada(_turno: TurnoConEstado): void {
    this.rechazar('pasar a "En Sala de Espera"');
  }

  atender(_turno: TurnoConEstado): void {
    this.rechazar('marcar como "Atendido"');
  }

  cancelar(_turno: TurnoConEstado): void {
    this.rechazar('cancelar');
  }

  protected rechazar(accion: string): never {
    throw new TransicionInvalidaError(
      `No se puede ${accion} un turno que está en estado "${this.nombre}".`,
    );
  }
}
