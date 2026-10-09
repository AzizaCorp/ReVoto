/** RN-06: únicas categorías válidas del desglose por sexo. */
export const SEXOS = ['H', 'M'] as const;
export type Sexo = (typeof SEXOS)[number];

export const ETIQUETA_SEXO: Record<Sexo, string> = { H: 'Hombres', M: 'Mujeres' };
