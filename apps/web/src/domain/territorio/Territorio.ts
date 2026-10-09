/**
 * RN-02: solo se publican tres niveles. La sección electoral es interna del pipeline
 * y no existe en el dominio de la app.
 */
export type NivelTerritorial = 'nacional' | 'entidad' | 'municipio';

export type Territorio =
  | { readonly nivel: 'nacional'; readonly nombre: string }
  | { readonly nivel: 'entidad'; readonly cveEntidad: number; readonly nombre: string }
  | {
      readonly nivel: 'municipio';
      readonly cveEntidad: number;
      readonly cveMunicipio: number;
      readonly nombre: string;
      readonly nombreEntidad: string;
    };

export const NACIONAL: Territorio = { nivel: 'nacional', nombre: 'Nacional' };

export function entidad(cveEntidad: number, nombre: string): Territorio {
  if (!Number.isInteger(cveEntidad) || cveEntidad < 1 || cveEntidad > 32) {
    throw new RangeError(`Clave de entidad inválida: ${cveEntidad}`);
  }
  return { nivel: 'entidad', cveEntidad, nombre };
}

export function municipio(
  cveEntidad: number,
  cveMunicipio: number,
  nombre: string,
  nombreEntidad: string,
): Territorio {
  entidad(cveEntidad, nombreEntidad);
  if (!Number.isInteger(cveMunicipio) || cveMunicipio < 1) {
    throw new RangeError(`Clave de municipio inválida: ${cveMunicipio}`);
  }
  return { nivel: 'municipio', cveEntidad, cveMunicipio, nombre, nombreEntidad };
}

/** Texto que acompaña a toda cifra (RN-10): «Zapopan, Jalisco», «Jalisco», «Nacional». */
export function etiquetaTerritorio(t: Territorio): string {
  return t.nivel === 'municipio' ? `${t.nombre}, ${t.nombreEntidad}` : t.nombre;
}

/** Territorio inmediato superior, usado cuando un municipio no alcanza el umbral (RN-05). */
export function territorioSuperior(t: Territorio): Territorio | null {
  if (t.nivel === 'municipio') return entidad(t.cveEntidad, t.nombreEntidad);
  if (t.nivel === 'entidad') return NACIONAL;
  return null;
}
