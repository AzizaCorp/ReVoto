/** RN-04: únicos grupos de edad publicables. La edad simple nunca se muestra. */
export const GRUPOS_EDAD = ['18-24', '25-34', '35-44', '45-59', '60+'] as const;

export type GrupoEdad = (typeof GRUPOS_EDAD)[number];

const LIMITES: Record<GrupoEdad, readonly [number, number]> = {
  '18-24': [18, 24],
  '25-34': [25, 34],
  '35-44': [35, 44],
  '45-59': [45, 59],
  '60+': [60, 110],
};

/** RN-09: fuera de 18–110 no hay grupo (el registro es anómalo). */
export function grupoDeEdad(edad: number): GrupoEdad | null {
  return GRUPOS_EDAD.find((g) => edad >= LIMITES[g][0] && edad <= LIMITES[g][1]) ?? null;
}
