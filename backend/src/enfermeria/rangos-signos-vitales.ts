/**
 * Rangos considerados normales para un adulto en reposo.
 *
 * El único valor que fija la consigna es la temperatura: por encima de
 * 39 °C debe generarse una alerta. Los demás son valores de referencia
 * habituales y se pueden ajustar acá sin tocar el resto del código.
 */
export const RANGOS_NORMALES = {
  presionSistolica: { minimo: 90, maximo: 140, etiqueta: 'Presión sistólica', unidad: 'mmHg' },
  presionDiastolica: { minimo: 60, maximo: 90, etiqueta: 'Presión diastólica', unidad: 'mmHg' },
  frecuenciaCardiaca: { minimo: 60, maximo: 100, etiqueta: 'Frecuencia cardíaca', unidad: 'lpm' },
  temperatura: { minimo: 35, maximo: 39, etiqueta: 'Temperatura', unidad: '°C' },
} as const;

export type ValoresSignosVitales = Record<keyof typeof RANGOS_NORMALES, number>;

/**
 * Devuelve la lista de valores fuera de rango (vacía si todo está normal).
 * Ejemplo: ["Temperatura: 39.5 °C (normal 35 a 39)"]
 */
export function detectarAnomalias(valores: ValoresSignosVitales): string[] {
  const anomalias: string[] = [];
  for (const clave of Object.keys(RANGOS_NORMALES) as (keyof typeof RANGOS_NORMALES)[]) {
    const rango = RANGOS_NORMALES[clave];
    const valor = valores[clave];
    if (valor < rango.minimo || valor > rango.maximo) {
      anomalias.push(
        `${rango.etiqueta}: ${valor} ${rango.unidad} (normal ${rango.minimo} a ${rango.maximo})`,
      );
    }
  }
  return anomalias;
}
