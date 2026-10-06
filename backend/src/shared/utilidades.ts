import type { ValueTransformer } from 'typeorm';

/** Convierte "2026-10-06" en un Date a las 00:00 hora local. */
export function inicioDelDia(fecha: string): Date {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

/** Convierte un Date en texto "AAAA-MM-DD" usando la hora local. */
export function aFechaLocal(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** Devuelve la hora "HH:mm" de un Date. */
export function aHoraLocal(fecha: Date): string {
  return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
}

export function sumarMinutos(fecha: Date, minutos: number): Date {
  return new Date(fecha.getTime() + minutos * 60_000);
}

/**
 * SQL Server devuelve las columnas DECIMAL como texto ("15000.00") para no
 * perder precisión. Este transformador las convierte a number al leerlas.
 */
export const transformadorDecimal: ValueTransformer = {
  to: (valor?: number | null) => valor,
  from: (valor?: string | number | null) =>
    valor === null || valor === undefined ? valor : Number(valor),
};
