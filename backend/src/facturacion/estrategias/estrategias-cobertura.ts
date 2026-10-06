/**
 * PATRÓN STRATEGY (Estrategia) - Épica 1 de Facturación
 * ------------------------------------------------------------------
 * Problema: la forma de cobrar una prestación cambia según la cobertura
 * del paciente (pública, prepaga o particular).
 *
 * Solución: cada forma de calcular es una CLASE intercambiable que cumple
 * la misma interfaz. El servicio de facturación elige una y la usa sin
 * saber cuál le tocó. Para sumar una cobertura nueva se agrega una clase,
 * sin modificar las existentes.
 */

export type TipoCobertura = 'PUBLICA' | 'PREPAGA' | 'PARTICULAR';

/** Quién paga una línea: el paciente, la prepaga (reclamo a terceros) o el Estado (subsidio). */
export type Pagador = 'PACIENTE' | 'PREPAGA' | 'ESTADO';

/** Una línea de cargo resultante del cálculo. */
export interface LineaDeCargo {
  aCargoDe: Pagador;
  importe: number;
  detalle: string;
}

/** La interfaz común: toda estrategia sabe calcular los cargos a partir del valor base. */
export interface EstrategiaDeCobertura {
  calcular(valorBase: number): LineaDeCargo[];
}

/** Cobertura Pública: subsidia el 100 %; el paciente abona cero. */
export class EstrategiaCoberturaPublica implements EstrategiaDeCobertura {
  calcular(valorBase: number): LineaDeCargo[] {
    return [
      { aCargoDe: 'PACIENTE', importe: 0, detalle: 'Cobertura pública: sin cargo para el paciente' },
      { aCargoDe: 'ESTADO', importe: valorBase, detalle: 'Cargo subsidiado por el Estado' },
    ];
  }
}

/** Medicina Prepaga: copago fijo para el paciente; el resto se reclama a la prepaga. */
export class EstrategiaMedicinaPrepaga implements EstrategiaDeCobertura {
  constructor(private readonly copagoFijo: number) {}

  calcular(valorBase: number): LineaDeCargo[] {
    // El copago nunca puede superar el valor de la prestación.
    const copago = Math.min(this.copagoFijo, valorBase);
    return [
      { aCargoDe: 'PACIENTE', importe: copago, detalle: 'Copago fijo' },
      { aCargoDe: 'PREPAGA', importe: valorBase - copago, detalle: 'Reclamo de facturación a terceros' },
    ];
  }
}

/** Particular (sin cobertura): el paciente paga el 100 % del valor del nomenclador. */
export class EstrategiaParticular implements EstrategiaDeCobertura {
  calcular(valorBase: number): LineaDeCargo[] {
    return [{ aCargoDe: 'PACIENTE', importe: valorBase, detalle: 'Particular: sin cobertura' }];
  }
}

/** Elige la estrategia que corresponde a la cobertura del paciente. */
export function elegirEstrategia(tipo: TipoCobertura, copagoFijo = 0): EstrategiaDeCobertura {
  switch (tipo) {
    case 'PUBLICA':
      return new EstrategiaCoberturaPublica();
    case 'PREPAGA':
      return new EstrategiaMedicinaPrepaga(copagoFijo);
    case 'PARTICULAR':
      return new EstrategiaParticular();
  }
}
