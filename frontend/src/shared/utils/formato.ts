/** Funciones para mostrar datos de forma amigable. */

const dosCifras = (numero: number) => String(numero).padStart(2, '0');

/** "2026-10-06T13:00:00.000Z" -> "10:00" (hora local del navegador). */
export function hora(iso: string): string {
  const fecha = new Date(iso);
  return `${dosCifras(fecha.getHours())}:${dosCifras(fecha.getMinutes())}`;
}

/** "2026-10-06T13:00:00.000Z" -> "06/10/2026 10:00". */
export function fechaHora(iso: string | null): string {
  if (!iso) return '-';
  const fecha = new Date(iso);
  return `${dosCifras(fecha.getDate())}/${dosCifras(fecha.getMonth() + 1)}/${fecha.getFullYear()} ${hora(iso)}`;
}

/** "2026-10-06" -> "06/10/2026" (para columnas que solo tienen fecha). */
export function fecha(soloFecha: string): string {
  const [anio, mes, dia] = soloFecha.split('-');
  return `${dia}/${mes}/${anio}`;
}

/** Fecha de hoy como "AAAA-MM-DD", el formato que usan los <input type="date">. */
export function hoy(): string {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${dosCifras(ahora.getMonth() + 1)}-${dosCifras(ahora.getDate())}`;
}

/** Fecha y hora actuales como "AAAA-MM-DDTHH:mm", para <input type="datetime-local">. */
export function ahoraLocal(): string {
  const ahora = new Date();
  return `${hoy()}T${dosCifras(ahora.getHours())}:${dosCifras(ahora.getMinutes())}`;
}

/** 15000 -> "$ 15.000,00". */
export function dinero(importe: number): string {
  return importe.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
}

export function nombreCompleto(persona: { nombre: string; apellido: string } | null | undefined): string {
  return persona ? `${persona.apellido}, ${persona.nombre}` : '-';
}
