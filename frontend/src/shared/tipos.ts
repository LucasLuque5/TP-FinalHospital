/**
 * Tipos de datos que devuelve el backend. Tenerlos en un solo lugar hace
 * que TypeScript avise si en una pantalla se escribe mal un campo.
 */

export type NombreRol = 'Administrador' | 'Médico' | 'Enfermero' | 'Recepcionista' | 'Paciente';

export interface UsuarioSesion {
  id: number;
  nombreUsuario: string;
  nombreCompleto: string;
  rol: NombreRol;
  pacienteId: number | null;
}

export interface Rol {
  id: number;
  nombre: NombreRol;
}

export interface Usuario {
  id: number;
  nombreUsuario: string;
  nombre: string;
  apellido: string;
  rol: Rol;
  activo: boolean;
}

// ---------- HCE ----------
export interface Paciente {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  sexo: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
}

export interface Alergia {
  id: number;
  sustancia: string;
  severidad: 'Leve' | 'Moderada' | 'Grave';
  observaciones: string | null;
}

export interface Antecedente {
  id: number;
  parentesco: string;
  enfermedad: string;
  observaciones: string | null;
}

export interface Evolucion {
  id: number;
  descripcion: string;
  registradoEn: string;
  medico: Usuario;
}

export interface Estudio {
  id: number;
  tipo: string;
  fecha: string;
  informe: string;
}

export interface HistoriaClinica {
  paciente: Paciente;
  alergias: Alergia[];
  antecedentes: Antecedente[];
  evoluciones: Evolucion[];
  estudios: Estudio[];
}

// ---------- Admisión ----------
export type EstadoTurno =
  | 'Disponible'
  | 'Programado'
  | 'Confirmado'
  | 'En Sala de Espera'
  | 'Atendido'
  | 'Cancelado';

export interface Turno {
  id: number;
  medicoId: number;
  medico: Usuario;
  paciente: Paciente | null;
  fechaHoraInicio: string;
  duracionMinutos: number;
  estado: EstadoTurno;
  esEntreturno: boolean;
  tiempoReducido: boolean;
}

export interface EnListaEspera {
  id: number;
  paciente: Paciente;
  medico: Usuario;
  fecha: string;
  creadoEn: string;
}

export interface EnGuardia {
  id: number;
  paciente: Paciente;
  nivel: number;
  nivelNombre: string;
  color: string;
  motivo: string;
  ingresoEn: string;
  posicion: number;
}

// ---------- Recursos ----------
export type EstadoCama = 'Libre' | 'Ocupada' | 'En limpieza' | 'Bloqueada';

export interface Habitacion {
  id: number;
  numero: string;
  piso: number;
  sector: string;
}

export interface Internacion {
  id: number;
  camaId: number;
  cama: Cama;
  pacienteId: number;
  paciente: Paciente;
  motivoIngreso: 'PRE_QUIRURGICO' | 'INFECCION_RESPIRATORIA' | 'OTRO';
  diagnosticoInicial: string | null;
  fechaIngreso: string;
  fechaEgreso: string | null;
}

export interface Cama {
  id: number;
  codigo: string;
  estado: EstadoCama;
  habitacion: Habitacion;
  internacion?: Internacion | null;
}

export interface Insumo {
  id: number;
  nombre: string;
  stock: number;
}

export interface MovimientoInventario {
  id: number;
  insumo: Insumo;
  tipo: 'INGRESO' | 'EGRESO';
  cantidad: number;
  motivo: string;
  eventoId: string | null;
  fecha: string;
}

// ---------- Enfermería ----------
export interface SignoVital {
  id: number;
  paciente: Paciente;
  enfermero: Usuario;
  presionSistolica: number;
  presionDiastolica: number;
  frecuenciaCardiaca: number;
  temperatura: number;
  fueraDeRango: boolean;
  registradoEn: string;
}

export interface NotaEnfermeria {
  id: number;
  texto: string;
  automatica: boolean;
  creadoEn: string;
  enfermero: Usuario;
}

export interface Dosis {
  id: number;
  horaProgramada: string;
  estado: 'Pendiente' | 'Administrada';
  administradaEn: string | null;
  enfermero: Usuario | null;
  indicacion: { id: number; descripcion: string; paciente: Paciente; insumo: Insumo };
}

export interface Protocolo {
  id: number;
  nombre: string;
  paciente: Paciente;
  creadoEn: string;
  tareas: { id: number; orden: number; descripcion: string; completada: boolean }[];
}

// ---------- Facturación ----------
export interface ObraSocial {
  id: number;
  nombre: string;
  tipo: 'PUBLICA' | 'PREPAGA';
  copagoFijo: number;
}

export interface Cobertura {
  id: number;
  paciente: Paciente;
  obraSocial: ObraSocial;
  numeroAfiliado: string;
}

export interface CoberturaValidada {
  tipo: 'PUBLICA' | 'PREPAGA' | 'PARTICULAR';
  obraSocial: ObraSocial | null;
  numeroAfiliado: string | null;
}

export interface Prestacion {
  id: number;
  codigo: string;
  nombre: string;
  valorBase: number;
}

export interface FacturaItem {
  id: number;
  concepto: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  importe: number;
  aCargoDe: 'PACIENTE' | 'PREPAGA' | 'ESTADO';
  obraSocial?: ObraSocial | null;
  eventoId: string | null;
  creadoEn: string;
  factura?: Factura;
}

export interface Factura {
  id: number;
  paciente: Paciente;
  tipo: 'PRESTACION' | 'ESTADIA';
  estado: 'Abierta' | 'Cerrada';
  creadoEn: string;
  items: FacturaItem[];
}

// ---------- Notificaciones ----------
export interface Notificacion {
  id: number;
  prioridad: 'NORMAL' | 'ALTA';
  titulo: string;
  mensaje: string;
  creadoEn: string;
}

export type Monitor = 'camas' | 'turnos' | 'guardia' | 'protocolos' | 'inventario';
