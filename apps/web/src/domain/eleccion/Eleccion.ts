/** Años de elección federal cubiertos por el producto. */
export const ANIOS_ELECCION = [2009, 2012, 2015, 2018, 2021, 2024] as const;

export type AnioEleccion = (typeof ANIOS_ELECCION)[number];

/** RN-03: intermedias y presidenciales deben distinguirse en toda comparación temporal. */
export type TipoEleccion = 'presidencial' | 'intermedia';

export interface Eleccion {
  readonly anio: AnioEleccion;
  readonly tipo: TipoEleccion;
}

export function esAnioEleccion(valor: number): valor is AnioEleccion {
  return (ANIOS_ELECCION as readonly number[]).includes(valor);
}

/** Las presidenciales ocurren cada 6 años desde 2012; las demás federales son intermedias. */
export function tipoDeEleccion(anio: AnioEleccion): TipoEleccion {
  return (anio - 2012) % 6 === 0 ? 'presidencial' : 'intermedia';
}

export function eleccion(anio: number): Eleccion {
  if (!esAnioEleccion(anio))
    throw new RangeError(`${anio} no es un año de elección federal del MVP`);
  return { anio, tipo: tipoDeEleccion(anio) };
}
