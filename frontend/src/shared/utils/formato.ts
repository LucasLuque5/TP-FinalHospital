const dosCifras = (numero: number) => String(numero).padStart(2, '0');

export function hora(iso: string): string {
  const fecha = new Date(iso);
  return `${dosCifras(fecha.getHours())}:${dosCifras(fecha.getMinutes())}`;
}

export function fechaHora(iso: string | null): string {
  if (!iso) return '-';
  const fecha = new Date(iso);
  return `${dosCifras(fecha.getDate())}/${dosCifras(fecha.getMonth() + 1)}/${fecha.getFullYear()} ${hora(iso)}`;
}

export function fecha(soloFecha: string): string {
  const [anio, mes, dia] = soloFecha.split('-');
  return `${dia}/${mes}/${anio}`;
}

export function hoy(): string {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${dosCifras(ahora.getMonth() + 1)}-${dosCifras(ahora.getDate())}`;
}

export function ahoraLocal(): string {
  const ahora = new Date();
  return `${hoy()}T${dosCifras(ahora.getHours())}:${dosCifras(ahora.getMinutes())}`;
}

export function dinero(importe: number): string {
  return importe.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
}

export function nombreCompleto(persona: { nombre: string; apellido: string } | null | undefined): string {
  return persona ? `${persona.apellido}, ${persona.nombre}` : '-';
}
