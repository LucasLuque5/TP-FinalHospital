import httpClient from '@/shared/services/httpClient';
import type { EnGuardia, EnListaEspera, Turno } from '@/shared/tipos';

export type AccionTurno = 'confirmar' | 'llegada' | 'atender' | 'cancelar';

export const admisionService = {
  // ---------- Turnos ----------
  async listarTurnos(fecha: string, medicoId?: number) {
    return (await httpClient.get<Turno[]>('/admision/turnos', { params: { fecha, medicoId } })).data;
  },
  async misTurnos() {
    return (await httpClient.get<Turno[]>('/admision/mis-turnos')).data;
  },
  async generarAgenda(datos: {
    medicoId: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    duracionMinutos: number;
  }) {
    return (await httpClient.post<Turno[]>('/admision/agenda', datos)).data;
  },
  async reservar(turnoId: number, pacienteId: number) {
    return (await httpClient.post<Turno>(`/admision/turnos/${turnoId}/reservar`, { pacienteId })).data;
  },
  async cambiarEstado(turnoId: number, accion: AccionTurno) {
    return (await httpClient.post<Turno>(`/admision/turnos/${turnoId}/${accion}`)).data;
  },
  async insertarEntreturno(datos: { medicoId: number; pacienteId: number; fechaHora: string }) {
    return (await httpClient.post<Turno>('/admision/entreturnos', datos)).data;
  },

  // ---------- Lista de espera ----------
  async listarEspera(fecha: string, medicoId?: number) {
    return (await httpClient.get<EnListaEspera[]>('/admision/lista-espera', { params: { fecha, medicoId } })).data;
  },
  async agregarAEspera(datos: { medicoId: number; pacienteId: number; fecha: string }) {
    await httpClient.post('/admision/lista-espera', datos);
  },

  // ---------- Guardia ----------
  async colaDeGuardia() {
    return (await httpClient.get<EnGuardia[]>('/admision/guardia')).data;
  },
  async registrarTriaje(datos: { pacienteId: number; nivel: number; motivo: string }) {
    return (await httpClient.post<EnGuardia>('/admision/guardia', datos)).data;
  },
  async atenderGuardia(id: number) {
    await httpClient.post(`/admision/guardia/${id}/atender`);
  },
};
