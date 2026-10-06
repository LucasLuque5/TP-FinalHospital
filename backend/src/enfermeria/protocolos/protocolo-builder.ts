/**
 * PATRÓN BUILDER (Constructor) - Épica 2 de Enfermería
 * ------------------------------------------------------------------
 * Problema: el "plan de cuidados" inicial de un paciente cambia mucho
 * según por qué ingresa. Armarlo con if/else mezclaría todos los
 * protocolos en un mismo lugar.
 *
 * Solución: el protocolo se arma PASO A PASO. Hay tres piezas:
 *   1. Producto  -> ProtocoloAtencion: lo que se quiere construir.
 *   2. Builder   -> ProtocoloBuilder: define los pasos de construcción.
 *                   Cada tipo de ingreso tiene su builder concreto.
 *   3. Director  -> DirectorDeProtocolos: sabe en qué ORDEN llamar a los
 *                   pasos, pero no qué tareas agrega cada uno.
 */

/** PRODUCTO: el protocolo de atención ya armado. */
export class ProtocoloAtencion {
  nombre = '';
  readonly tareas: string[] = [];
}

/** BUILDER: los pasos que todo constructor de protocolos debe saber hacer. */
export interface ProtocoloBuilder {
  reiniciar(): void;
  definirNombre(): void;
  agregarTareasDePreparacion(): void;
  agregarTareasDeMonitoreo(): void;
  agregarTareasDeAislamiento(): void;
  obtenerResultado(): ProtocoloAtencion;
}

/** Parte común a todos los builders, para no repetir código. */
abstract class ProtocoloBuilderBase implements ProtocoloBuilder {
  protected protocolo = new ProtocoloAtencion();

  reiniciar(): void {
    this.protocolo = new ProtocoloAtencion();
  }

  abstract definirNombre(): void;

  // Por defecto un paso no agrega nada. Cada builder sobrescribe los que usa.
  agregarTareasDePreparacion(): void {}
  agregarTareasDeMonitoreo(): void {}
  agregarTareasDeAislamiento(): void {}

  obtenerResultado(): ProtocoloAtencion {
    return this.protocolo;
  }
}

/** BUILDER CONCRETO: "Ingreso Pre-Quirúrgico" (HU 2.1, Escenario 1). */
export class PreOpProtocolBuilder extends ProtocoloBuilderBase {
  definirNombre(): void {
    this.protocolo.nombre = 'Ingreso Pre-Quirúrgico';
  }

  override agregarTareasDePreparacion(): void {
    this.protocolo.tareas.push('Verificar ayuno de 8 horas');
    this.protocolo.tareas.push('Colocar vía intravenosa periférica');
  }

  override agregarTareasDeMonitoreo(): void {
    this.protocolo.tareas.push('Realizar control de signos vitales cada 2 horas');
  }
}

/** BUILDER CONCRETO: "Ingreso por Infección Respiratoria" (HU 2.1, Escenario 2). */
export class RespiratoryProtocolBuilder extends ProtocoloBuilderBase {
  definirNombre(): void {
    this.protocolo.nombre = 'Ingreso por Infección Respiratoria';
  }

  override agregarTareasDeMonitoreo(): void {
    this.protocolo.tareas.push('Monitoreo de saturación de oxígeno continuo');
  }

  override agregarTareasDeAislamiento(): void {
    this.protocolo.tareas.push('Indicación de aislamiento de contacto y gotas');
  }
}

/** DIRECTOR: la "receta" con el orden de los pasos. Sirve para cualquier builder. */
export class DirectorDeProtocolos {
  construirProtocoloDeIngreso(builder: ProtocoloBuilder): ProtocoloAtencion {
    builder.reiniciar();
    builder.definirNombre();
    builder.agregarTareasDePreparacion();
    builder.agregarTareasDeMonitoreo();
    builder.agregarTareasDeAislamiento();
    return builder.obtenerResultado();
  }
}

/**
 * Elige el builder según el motivo de ingreso. Devuelve null cuando el
 * motivo no tiene un protocolo definido en las consignas (motivo "OTRO").
 */
export function elegirBuilder(motivoIngreso: string): ProtocoloBuilder | null {
  switch (motivoIngreso) {
    case 'PRE_QUIRURGICO':
      return new PreOpProtocolBuilder();
    case 'INFECCION_RESPIRATORIA':
      return new RespiratoryProtocolBuilder();
    default:
      return null;
  }
}
