// Espejo en TypeScript de los tokens que necesita el código (gráficas, cálculos de layout).
// Mantener sincronizado con tokens.css: si cambias un valor allá, cámbialo aquí.

export const espacio = { 1: 8, 2: 16, 3: 24, 4: 32, 6: 48 } as const;

export const marco = {
  ancho: 360,
  alto: 760,
  max: 480,
  zonaSuperior: 56,
  zonaInferior: 72,
  /** Alto visible del contenido de una pantalla narrativa sin desplazamiento (§3). */
  contenido: 760 - 56 - 72,
} as const;

export const objetivoTactil = 44;

/** Tipos de elección que deben distinguirse en toda comparación temporal (RN-03). */
export type TipoEleccion = 'presidencial' | 'intermedia';

/** Variable CSS del relleno de cada tipo de serie; nunca depende solo del color. */
export const rellenoSerie: Record<TipoEleccion, string> = {
  presidencial: 'var(--rv-serie-presidencial)',
  intermedia: 'var(--rv-serie-intermedia)',
};
