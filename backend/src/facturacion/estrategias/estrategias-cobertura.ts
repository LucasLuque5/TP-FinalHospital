export type TipoCobertura = 'PUBLICA' | 'PREPAGA' | 'PARTICULAR';

export type Pagador = 'PACIENTE' | 'PREPAGA' | 'ESTADO';

export interface LineaDeCargo {
  aCargoDe: Pagador;
  importe: number;
  detalle: string;
}

export interface EstrategiaDeCobertura {
  calcular(valorBase: number): LineaDeCargo[];
}

export class EstrategiaCoberturaPublica implements EstrategiaDeCobertura {
  calcular(valorBase: number): LineaDeCargo[] {
    return [
      { aCargoDe: 'PACIENTE', importe: 0, detalle: 'Cobertura pública: sin cargo para el paciente' },
      { aCargoDe: 'ESTADO', importe: valorBase, detalle: 'Cargo subsidiado por el Estado' },
    ];
  }
}

export class EstrategiaMedicinaPrepaga implements EstrategiaDeCobertura {
  constructor(private readonly copagoFijo: number) {}

  calcular(valorBase: number): LineaDeCargo[] {
    const copago = Math.min(this.copagoFijo, valorBase);
    return [
      { aCargoDe: 'PACIENTE', importe: copago, detalle: 'Copago fijo' },
      { aCargoDe: 'PREPAGA', importe: valorBase - copago, detalle: 'Reclamo de facturación a terceros' },
    ];
  }
}

export class EstrategiaParticular implements EstrategiaDeCobertura {
  calcular(valorBase: number): LineaDeCargo[] {
    return [{ aCargoDe: 'PACIENTE', importe: valorBase, detalle: 'Particular: sin cobertura' }];
  }
}

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
