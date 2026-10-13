import type { ArchetypeId, BadgeId } from '@/domain';

/** Headline and first-person phrase of each crossing «Mi municipio y yo» (design P9, 30 cards). */
export const CROSSINGS: Record<BadgeId, Record<ArchetypeId, { title: string; phrase: string }>> = {
  I1: {
    A1: { title: 'SANGRE NUEVA', phrase: 'Mi municipio nunca falla y yo acabo de llegar.' },
    A2: { title: 'OLA NUEVA', phrase: 'Mi municipio va subiendo y yo me subo.' },
    A3: { title: 'PRIMER VUELO', phrase: 'Mi municipio sube y baja; yo apenas despego.' },
    A4: {
      title: 'GRAN ESTRENO',
      phrase: 'Mi municipio se luce en presidenciales y yo debuté en una.',
    },
    A5: { title: 'RELEVO', phrase: 'Mi municipio viene bajando; yo llego a sumar.' },
  },
  I2: {
    A1: { title: 'DE CASTA', phrase: 'Mi municipio nunca falla y yo tampoco: 3 de 3.' },
    A2: { title: 'VIENTO A FAVOR', phrase: 'Mi municipio va en subida y yo voy 3 de 3.' },
    A3: { title: 'ANCLA', phrase: 'Mi municipio es montaña rusa; yo, 3 de 3.' },
    A4: { title: 'SIN TEMPORADA', phrase: 'Mi municipio sale en presidenciales; yo, en todas.' },
    A5: { title: 'CONTRA­CORRIENTE', phrase: 'Mi municipio viene bajando; yo voy 3 de 3.' },
  },
  I3: {
    A1: { title: 'A MI ESTILO', phrase: 'Mi municipio nunca falla; yo voy a las grandes.' },
    A2: { title: 'EN CAMINO', phrase: 'Mi municipio sube cada vez; yo ya voy a las grandes.' },
    A3: {
      title: 'GRANDES LIGAS',
      phrase: 'Mi municipio sube y baja; yo no me pierdo una presidencial.',
    },
    A4: {
      title: 'DE TRADICIÓN',
      phrase: 'Mi municipio y yo: presentes cuando se elige presidencia.',
    },
    A5: { title: 'PRESENTE', phrase: 'Mi municipio viene bajando; yo sigo en las presidenciales.' },
  },
  I4: {
    A1: { title: 'EN SINTONÍA', phrase: 'Mi municipio nunca falla y yo ya agarré el ritmo.' },
    A2: { title: 'DOBLE SUBIDA', phrase: 'Mi municipio sube y yo también: vamos en racha.' },
    A3: { title: 'AL ALZA', phrase: 'Mi municipio sube y baja; yo voy de subida.' },
    A4: {
      title: 'CALENTANDO',
      phrase: 'Mi municipio se enciende en presidenciales; yo ya voté en 2024.',
    },
    A5: { title: 'CHISPA', phrase: 'Mi municipio viene bajando; yo voy en racha.' },
  },
  I5: {
    A1: { title: 'A MI RITMO', phrase: 'Mi municipio nunca falla; yo voto a mi ritmo.' },
    A2: { title: 'SIN PRISA', phrase: 'Mi municipio sube escalón a escalón; yo, a mi paso.' },
    A3: { title: 'MISMA ONDA', phrase: 'Mi municipio y yo: nunca se sabe qué viene.' },
    A4: {
      title: 'CALENDARIO PROPIO',
      phrase: 'Mi municipio se llena en presidenciales; yo, a mi manera.',
    },
    A5: { title: 'CONTRA­TIEMPO', phrase: 'Mi municipio viene bajando; yo decido cuándo.' },
  },
  I6: {
    A1: { title: 'TE ESPERAN', phrase: 'Mi municipio nunca falla; a mí me falta estrenarme.' },
    A2: {
      title: 'PRÓXIMO ESCALÓN',
      phrase: 'Mi municipio va subiendo; el siguiente escalón es mi voto.',
    },
    A3: { title: 'EL GIRO', phrase: 'Mi municipio sube y baja; mi voto puede inclinarlo.' },
    A4: {
      title: 'MI TURNO',
      phrase: 'Mi municipio se llena en presidenciales; la próxima, voy yo.',
    },
    A5: { title: 'REFUERZO', phrase: 'Mi municipio viene bajando; mi voto puede cambiarlo.' },
  },
};

/** Archetype figure in the crossing: short (square card) and long (story). */
export const ARCHETYPE_STAT: Record<ArchetypeId, [string, string]> = {
  A1: ['+—.— pts sobre el país', '+—.— pts sobre el país, elección tras elección'],
  A2: ['+—.— pts por década', '+—.— pts por década frente al país'],
  A3: ['—.— pts de variación', '—.— pts de variación entre elecciones'],
  A4: ['+—.— pts en presidenciales', '+—.— pts extra en presidenciales'],
  A5: ['−—.— pts por década', '−—.— pts por década frente al país'],
};

/** Headline size: the longest word must fit the available width (design `head_size`). */
export function headlineSize(title: string, base: number, available: number): number {
  const longest = Math.max(...title.split(/[­ ]/).map((w) => w.length));
  return Math.min(base, Math.floor(available / (longest * 0.84)));
}
