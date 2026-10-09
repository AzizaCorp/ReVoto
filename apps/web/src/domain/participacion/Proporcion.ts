declare const marca: unique symbol;

/** Valor entre 0 y 1. El formato de porcentaje es responsabilidad de la presentación. */
export type Proporcion = number & { readonly [marca]: 'Proporcion' };

export function proporcion(valor: number): Proporcion {
  if (!Number.isFinite(valor) || valor < 0 || valor > 1) {
    throw new RangeError(`Una proporción debe estar entre 0 y 1: ${valor}`);
  }
  return valor as Proporcion;
}

/** Diferencia en puntos porcentuales (a − b), p. ej. territorio vs. nacional. */
export function diferenciaEnPuntos(a: Proporcion, b: Proporcion): number {
  return Math.round((a - b) * 1000) / 10;
}
