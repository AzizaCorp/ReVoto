// Readable addresses of the views: `/elige-tu-territorio` instead of `#/W-02`. The old hash
// addresses (`#/W-04`, used before) still open the same view and are rewritten to the new one.
import { screenFromText } from '@/domain';
import type { AuxiliaryViewId, ViewId } from './Navigation';

/** Address of each view, without the base path. The cover is `/inicio` (and `/`). */
export const SLUGS: Record<ViewId, string> = {
  'W-01': 'inicio',
  'W-02': 'elige-tu-territorio',
  'W-02b': 'sobre-ti',
  'W-03': 'mexico-voto',
  'W-04': 'tu-territorio',
  'W-05': 'quince-anos',
  'W-06': 'tu-generacion',
  'W-07': 'mujeres-y-hombres',
  'W-08': 'tu-lugar',
  'W-09': 'tu-arquetipo',
  'W-09b': 'tu-insignia',
  'W-09c': 'mi-municipio-y-yo',
  'W-10': 'tu-resumen',
  'W-15': 'version-ligera',
  'W-16': 'datos-abiertos',
  'W-17': 'estados',
  'W-18': 'metodologia',
  'W-19': 'diccionario-de-datos',
};

const AUXILIARY = ['W-15', 'W-16', 'W-17', 'W-18', 'W-19'] as const;
const BY_SLUG = new Map(Object.entries(SLUGS).map(([view, slug]) => [slug, view as ViewId]));

/** Base path of the app (`/` unless Vite builds it under a folder). */
export const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/?$/, '/');

/** `/tu-territorio` for W-04 (with the base path). */
export const pathOf = (view: ViewId) => `${BASE}${SLUGS[view]}`;

/** A view code as written in the old hash addresses: «W-04», «w-09b», «W-16». */
function viewFromCode(text: string): ViewId | null {
  const aux = AUXILIARY.find((a) => a === text.toUpperCase()) as AuxiliaryViewId | undefined;
  return aux ?? screenFromText(text);
}

/** Old hash address (`#/W-04` or `#/W-04?t=…`), or null when the hash is not one. */
export function viewFromLegacyHash(hash: string): ViewId | null {
  const m = /^#\/([^?]+)/.exec(hash);
  return m ? viewFromCode(decodeURIComponent(m[1]!)) : null;
}

/** View of an address: the old hash first, then the readable path; null when unknown. */
export function viewFromLocation(loc: { pathname: string; hash: string }): ViewId | null {
  const legacy = viewFromLegacyHash(loc.hash);
  if (legacy) return legacy;
  const path = loc.pathname.startsWith(BASE) ? loc.pathname.slice(BASE.length) : loc.pathname;
  const slug = decodeURIComponent(path.replace(/^\/+|\/+$/g, '')).toLowerCase();
  if (slug === '') return 'W-01';
  return BY_SLUG.get(slug) ?? viewFromCode(slug);
}
