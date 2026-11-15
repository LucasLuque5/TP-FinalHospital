export class ProtocoloAtencion {
  nombre = '';
  readonly tareas: string[] = [];
}

export interface ProtocoloBuilder {
  reiniciar(): void;
  definirNombre(): void;
  agregarTareasDePreparacion(): void;
  agregarTareasDeMonitoreo(): void;
  agregarTareasDeAislamiento(): void;
  obtenerResultado(): ProtocoloAtencion;
}

abstract class ProtocoloBuilderBase implements ProtocoloBuilder {
  protected protocolo = new ProtocoloAtencion();

  reiniciar(): void {
    this.protocolo = new ProtocoloAtencion();
  }

  abstract definirNombre(): void;

  agregarTareasDePreparacion(): void {}
  agregarTareasDeMonitoreo(): void {}
  agregarTareasDeAislamiento(): void {}

  obtenerResultado(): ProtocoloAtencion {
    return this.protocolo;
  }
}

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
