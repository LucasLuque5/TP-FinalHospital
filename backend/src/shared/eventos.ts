export const EVENTOS = {
  TURNO_ATENDIDO: 'turno.atendido',
  INTERNACION_INICIADA: 'internacion.iniciada',
  INTERNACION_FINALIZADA: 'internacion.finalizada',
  MEDICACION_ADMINISTRADA: 'medicacion.administrada',
  CAMA_ESTADO_CAMBIADO: 'cama.estado-cambiado',
} as const;

export interface TurnoAtendidoEvento {
  turnoId: number;
  pacienteId: number;
  medicoId: number;
}

export interface InternacionIniciadaEvento {
  internacionId: number;
  pacienteId: number;
  camaCodigo: string;
  motivoIngreso: string;
}

export interface InternacionFinalizadaEvento {
  internacionId: number;
  pacienteId: number;
}

export interface MedicacionAdministradaEvento {
  eventoId: string;
  administracionId: number;
  pacienteId: number;
  insumoId: number;
  insumoNombre: string;
  cantidad: number;
  enfermeroId: number;
}

export interface CamaEstadoCambiadoEvento {
  camaId: number;
  camaCodigo: string;
  estadoAnterior: string;
  estadoNuevo: string;
}
