import { UnprocessableEntityException } from '@nestjs/common';

/**
 * PATRÓN STATE (Estado) - Épica 2 de Admisión
 * ------------------------------------------------------------------
 * Problema: un turno se comporta distinto según su estado. Sin el patrón
 * terminaríamos con un "if (estado === ...)" gigante en cada operación.
 *
 * Solución: cada estado es una CLASE. Cada clase sabe qué acciones
 * permite y a qué estado lleva cada una. Lo que no está permitido,
 * directamente no se sobrescribe y cae en el rechazo por defecto.
 */

export enum NombreEstadoTurno {
  Disponible = 'Disponible',
  Programado = 'Programado',
  Confirmado = 'Confirmado',
  EnSalaDeEspera = 'En Sala de Espera',
  Atendido = 'Atendido',
  Cancelado = 'Cancelado',
}

/** El "contexto" del patrón: cualquier objeto que tenga un estado (la entidad Turno). */
export interface TurnoConEstado {
  estado: NombreEstadoTurno;
}

/** Error de validación de negocio. Nest lo convierte en una respuesta HTTP 422. */
export class TransicionInvalidaError extends UnprocessableEntityException {}

/**
 * Clase base: por defecto TODAS las acciones están prohibidas.
 * Cada estado concreto sobrescribe solo las que sí permite.
 */
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
