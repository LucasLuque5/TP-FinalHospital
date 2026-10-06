/**
 * EVENTOS DEL SISTEMA
 *
 * Los módulos (componentes) no se llaman entre sí para "avisarse" cosas:
 * publican un evento y los interesados lo escuchan. Así, por ejemplo,
 * Enfermería no necesita conocer a Facturación ni a Inventario.
 *
 * Acá se definen los nombres de los eventos y los datos que lleva cada uno.
 */
export const EVENTOS = {
  TURNO_ATENDIDO: 'turno.atendido',
  INTERNACION_INICIADA: 'internacion.iniciada',
  INTERNACION_FINALIZADA: 'internacion.finalizada',
  MEDICACION_ADMINISTRADA: 'medicacion.administrada',
  CAMA_ESTADO_CAMBIADO: 'cama.estado-cambiado',
} as const;

/** Lo publica Admisión cuando el médico termina la consulta. */
export interface TurnoAtendidoEvento {
  turnoId: number;
  pacienteId: number;
  medicoId: number;
}

/** Lo publica Recursos cuando se asigna una cama a un paciente. */
export interface InternacionIniciadaEvento {
  internacionId: number;
  pacienteId: number;
  camaCodigo: string;
  motivoIngreso: string;
}

/** Lo publica Recursos cuando el paciente recibe el alta. */
export interface InternacionFinalizadaEvento {
  internacionId: number;
  pacienteId: number;
}

/** Lo publica Enfermería cuando se marca una dosis como "Administrada". */
export interface MedicacionAdministradaEvento {
  /** Identificador único del evento: sirve para la trazabilidad de auditoría. */
  eventoId: string;
  administracionId: number;
  pacienteId: number;
  insumoId: number;
  insumoNombre: string;
  cantidad: number;
  enfermeroId: number;
}

/** Lo publica Recursos cada vez que una cama cambia de estado. */
export interface CamaEstadoCambiadoEvento {
  camaId: number;
  camaCodigo: string;
  estadoAnterior: string;
  estadoNuevo: string;
}
