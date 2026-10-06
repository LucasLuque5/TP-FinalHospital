import httpClient from '@/shared/services/httpClient';
import type { HistoriaClinica, Paciente } from '@/shared/tipos';

export type DatosPaciente = Omit<Paciente, 'id'>;

export const hceService = {
  async listarPacientes(buscar = '') {
    return (await httpClient.get<Paciente[]>('/hce/pacientes', { params: { buscar } })).data;
  },
  async registrarPaciente(datos: Partial<DatosPaciente>) {
    return (await httpClient.post<Paciente>('/hce/pacientes', datos)).data;
  },
  async obtenerHistoria(pacienteId: number) {
    return (await httpClient.get<HistoriaClinica>(`/hce/pacientes/${pacienteId}/historia`)).data;
  },
  async registrarAlergia(pacienteId: number, datos: { sustancia: string; severidad: string; observaciones?: string }) {
    await httpClient.post(`/hce/pacientes/${pacienteId}/alergias`, datos);
  },
  async registrarAntecedente(pacienteId: number, datos: { parentesco: string; enfermedad: string; observaciones?: string }) {
    await httpClient.post(`/hce/pacientes/${pacienteId}/antecedentes`, datos);
  },
  async registrarEvolucion(pacienteId: number, descripcion: string) {
    await httpClient.post(`/hce/pacientes/${pacienteId}/evoluciones`, { descripcion });
  },
};
