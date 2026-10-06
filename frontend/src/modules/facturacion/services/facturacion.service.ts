import httpClient from '@/shared/services/httpClient';
import type {
  Cobertura,
  CoberturaValidada,
  Factura,
  FacturaItem,
  ObraSocial,
  Prestacion,
} from '@/shared/tipos';

export interface ResumenFacturacion {
  porPagador: { aCargoDe: string; cantidad: number; total: number }[];
  porConcepto: { concepto: string; cantidad: number; total: number }[];
}

export const facturacionService = {
  async listarObrasSociales() {
    return (await httpClient.get<ObraSocial[]>('/facturacion/obras-sociales')).data;
  },
  async listarCoberturas() {
    return (await httpClient.get<Cobertura[]>('/facturacion/coberturas-pacientes')).data;
  },
  async asignarCobertura(datos: { pacienteId: number; obraSocialId: number; numeroAfiliado: string }) {
    await httpClient.post('/facturacion/coberturas-pacientes', datos);
  },
  async validarCobertura(pacienteId: number) {
    return (await httpClient.get<CoberturaValidada>(`/facturacion/coberturas-pacientes/validar/${pacienteId}`)).data;
  },
  async listarPrestaciones() {
    return (await httpClient.get<Prestacion[]>('/facturacion/prestaciones')).data;
  },
  async facturarPrestacion(pacienteId: number, prestacionId: number) {
    return (await httpClient.post<Factura>('/facturacion/facturas', { pacienteId, prestacionId })).data;
  },
  async listarFacturas() {
    return (await httpClient.get<Factura[]>('/facturacion/facturas')).data;
  },
  async listarItems() {
    return (await httpClient.get<FacturaItem[]>('/facturacion/facturas-items')).data;
  },
  async resumen() {
    return (await httpClient.get<ResumenFacturacion>('/facturacion/reportes/resumen')).data;
  },
};
