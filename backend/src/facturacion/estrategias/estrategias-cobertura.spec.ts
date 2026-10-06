import {
  EstrategiaCoberturaPublica,
  EstrategiaMedicinaPrepaga,
  EstrategiaParticular,
  elegirEstrategia,
} from './estrategias-cobertura.js';

const VALOR_CONSULTA = 15000;

describe('Patrón Strategy - cálculo de costos según cobertura', () => {
  it('Cobertura pública: paciente $0 y Estado el 100 %', () => {
    expect(new EstrategiaCoberturaPublica().calcular(VALOR_CONSULTA)).toMatchObject([
      { aCargoDe: 'PACIENTE', importe: 0 },
      { aCargoDe: 'ESTADO', importe: 15000 },
    ]);
  });

  it('Prepaga: copago fijo al paciente y el resto a la prepaga', () => {
    expect(new EstrategiaMedicinaPrepaga(3000).calcular(VALOR_CONSULTA)).toMatchObject([
      { aCargoDe: 'PACIENTE', importe: 3000 },
      { aCargoDe: 'PREPAGA', importe: 12000 },
    ]);
  });

  it('Prepaga: el copago nunca supera el valor de la prestación', () => {
    const lineas = new EstrategiaMedicinaPrepaga(3000).calcular(2000);
    expect(lineas[0].importe).toBe(2000);
    expect(lineas[1].importe).toBe(0);
  });

  it('Particular: el paciente paga el 100 %', () => {
    expect(new EstrategiaParticular().calcular(VALOR_CONSULTA)).toMatchObject([
      { aCargoDe: 'PACIENTE', importe: 15000 },
    ]);
  });

  it('en todas las estrategias la suma de las líneas es igual al valor base', () => {
    for (const tipo of ['PUBLICA', 'PREPAGA', 'PARTICULAR'] as const) {
      const total = elegirEstrategia(tipo, 3000)
        .calcular(VALOR_CONSULTA)
        .reduce((suma, linea) => suma + linea.importe, 0);
      expect(total).toBe(VALOR_CONSULTA);
    }
  });
});
