import httpClient from '@/shared/services/httpClient';
import type { Dosis, NotaEnfermeria, Protocolo, SignoVital } from '@/shared/tipos';

export const enfermeriaService = {
  // ---------- Signos vitales ----------
  async listarSignos(pacienteId?: number) {
    return (await httpClient.get<SignoVital[]>('/enfermeria/signos-vitales', { params: { pacienteId } })).data;
  },
  async registrarSignos(datos: {
    internacionId: number;
    presionSistolica: number;
    presionDiastolica: number;
    frecuenciaCardiaca: number;
    temperatura: number;
  }) {
    return (await httpClient.post<SignoVital>('/enfermeria/signos-vitales', datos)).data;
  },

  // ---------- Notas ----------
  async listarNotas(pacienteId: number) {
    return (await httpClient.get<NotaEnfermeria[]>('/enfermeria/notas', { params: { pacienteId } })).data;
  },
  async crearNota(pacienteId: number, texto: string) {
    await httpClient.post('/enfermeria/notas', { pacienteId, texto });
  },

  // ---------- Medicación ----------
  async listarMedicacion() {
    return (await httpClient.get<Dosis[]>('/enfermeria/medicacion')).data;
  },
  async administrar(dosisId: number) {
    return (await httpClient.post<Dosis>(`/enfermeria/medicacion/${dosisId}/administrar`)).data;
  },
  async crearIndicacion(datos: {
    pacienteId: number;
    insumoId: number;
    descripcion: string;
    frecuenciaHoras: number;
    primeraDosis: string;
    cantidadDosis: number;
  }) {
    await httpClient.post('/enfermeria/indicaciones', datos);
  },

  // ---------- Protocolos ----------
  async listarProtocolos() {
    return (await httpClient.get<Protocolo[]>('/enfermeria/protocolos')).data;
  },
  async completarTarea(tareaId: number) {
    await httpClient.post(`/enfermeria/protocolos/tareas/${tareaId}/completar`);
  },
};
