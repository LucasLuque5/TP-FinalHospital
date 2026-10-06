import httpClient from '@/shared/services/httpClient';
import type { Cama, Insumo, Internacion, MovimientoInventario } from '@/shared/tipos';

export type AccionCama = 'confirmar-limpieza' | 'bloquear' | 'desbloquear';

export const recursosService = {
  // ---------- Camas ----------
  async mapaDeCamas() {
    return (await httpClient.get<Cama[]>('/recursos/camas')).data;
  },
  async asignarCama(
    camaId: number,
    datos: { pacienteId: number; motivoIngreso: string; diagnosticoInicial?: string },
  ) {
    return (await httpClient.post<Internacion>(`/recursos/camas/${camaId}/asignar`, datos)).data;
  },
  async aplicarAccion(camaId: number, accion: AccionCama) {
    await httpClient.post(`/recursos/camas/${camaId}/${accion}`);
  },

  // ---------- Internaciones ----------
  async internacionesActivas() {
    return (await httpClient.get<Internacion[]>('/recursos/internaciones')).data;
  },
  async darDeAlta(internacionId: number) {
    await httpClient.post(`/recursos/internaciones/${internacionId}/alta`);
  },
  async historialDeCamas() {
    return (await httpClient.get<Internacion[]>('/recursos/camas-historial')).data;
  },

  // ---------- Inventario ----------
  async listarInsumos() {
    return (await httpClient.get<Insumo[]>('/recursos/insumos')).data;
  },
  async registrarIngreso(insumoId: number, datos: { cantidad: number; motivo: string }) {
    await httpClient.post(`/recursos/insumos/${insumoId}/ingresos`, datos);
  },
  async listarMovimientos() {
    return (await httpClient.get<MovimientoInventario[]>('/recursos/movimientos-inventarios')).data;
  },
};
