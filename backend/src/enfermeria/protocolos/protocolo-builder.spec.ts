import { detectarAnomalias } from '../rangos-signos-vitales.js';
import {
  DirectorDeProtocolos,
  PreOpProtocolBuilder,
  RespiratoryProtocolBuilder,
  elegirBuilder,
} from './protocolo-builder.js';

describe('Patrón Builder - protocolos de atención', () => {
  const director = new DirectorDeProtocolos();

  it('Pre-Op Protocol Builder genera las tareas del ingreso pre-quirúrgico', () => {
    const protocolo = director.construirProtocoloDeIngreso(new PreOpProtocolBuilder());

    expect(protocolo.nombre).toBe('Ingreso Pre-Quirúrgico');
    expect(protocolo.tareas).toEqual([
      'Verificar ayuno de 8 horas',
      'Colocar vía intravenosa periférica',
      'Realizar control de signos vitales cada 2 horas',
    ]);
  });

  it('Respiratory Protocol Builder genera las tareas de infección respiratoria', () => {
    const protocolo = director.construirProtocoloDeIngreso(new RespiratoryProtocolBuilder());

    expect(protocolo.tareas).toEqual([
      'Monitoreo de saturación de oxígeno continuo',
      'Indicación de aislamiento de contacto y gotas',
    ]);
  });

  it('el mismo builder se puede reutilizar sin acumular tareas', () => {
    const builder = new PreOpProtocolBuilder();
    director.construirProtocoloDeIngreso(builder);
    expect(director.construirProtocoloDeIngreso(builder).tareas).toHaveLength(3);
  });

  it('elige el builder según el motivo de ingreso', () => {
    expect(elegirBuilder('PRE_QUIRURGICO')).toBeInstanceOf(PreOpProtocolBuilder);
    expect(elegirBuilder('INFECCION_RESPIRATORIA')).toBeInstanceOf(RespiratoryProtocolBuilder);
    expect(elegirBuilder('OTRO')).toBeNull();
  });
});

describe('Rangos de signos vitales', () => {
  const normales = { presionSistolica: 120, presionDiastolica: 80, frecuenciaCardiaca: 70, temperatura: 36.5 };

  it('no detecta anomalías con valores normales', () => {
    expect(detectarAnomalias(normales)).toEqual([]);
  });

  it('39 °C exactos todavía es normal; por encima de 39 °C es anomalía', () => {
    expect(detectarAnomalias({ ...normales, temperatura: 39 })).toEqual([]);
    expect(detectarAnomalias({ ...normales, temperatura: 39.1 })).toHaveLength(1);
  });
});
