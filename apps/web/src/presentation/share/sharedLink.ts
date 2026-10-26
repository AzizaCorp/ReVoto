// US-24 · Links that open a screen as the person who shared it sees it: the screen, the territory
// and, only when the person turns it on in W-12, the «Sobre ti» answers (RN-08). The screen is the
// path and the data travels in the fragment (`/tu-territorio#t=9-6&r=1010`), which browsers never
// send to the server; the app removes it from the address bar once it has been read. Old links
// (`#/W-04?t=9-6&r=1010`) still work.
import type { Territory } from '@/domain';
import type { ViewId } from '@/presentation/providers/Navigation';
import { QUESTIONS, type Answers, type QuestionKey } from '@/presentation/providers/Profile';
import { pathOf, viewFromLocation } from '@/presentation/providers/routes';

/** Territory of a link: a state (`9`) or a municipality (`9-6`); none means the country. */
export interface LinkTerritory {
  readonly stateCode: number;
  readonly municipalityCode?: number;
}

export interface SharedLink {
  /** View of the address, or null when it is not one. */
  readonly view: ViewId | null;
  readonly territory: LinkTerritory | null;
  /** Answers of the person who shared, or null when the link does not carry them. */
  readonly answers: Partial<Answers> | null;
}

const NO_ANSWER = '_';

/** «10_0»: one character per question, the index of the chosen option or «_». */
export function encodeAnswers(answers: Answers): string | null {
  const code = QUESTIONS.map((q) => {
    const i = (q.options as readonly string[]).indexOf(answers[q.key] ?? '');
    return i < 0 ? NO_ANSWER : String(i);
  }).join('');
  return /^_+$/.test(code) ? null : code;
}

export function decodeAnswers(code: string): Partial<Answers> | null {
  if (code.length !== QUESTIONS.length) return null;
  const out: Partial<Record<QuestionKey, string>> = {};
  QUESTIONS.forEach((q, i) => {
    const option = (q.options as readonly string[])[Number(code[i])];
    if (code[i] !== NO_ANSWER && option) out[q.key] = option;
  });
  return Object.keys(out).length ? out : null;
}

const territoryCode = (t: Territory): string | null =>
  t.level === 'municipality'
    ? `${t.stateCode}-${t.municipalityCode}`
    : t.level === 'state'
      ? String(t.stateCode)
      : null;

/** Link to `view` with the territory and, if given, the answers. `origin`: «https://revoto.mx». */
export function buildShareUrl(
  origin: string,
  view: ViewId,
  territory: Territory,
  answers?: Answers,
): string {
  const params = new URLSearchParams();
  const t = territoryCode(territory);
  if (t) params.set('t', t);
  const r = answers ? encodeAnswers(answers) : null;
  if (r) params.set('r', r);
  const query = params.toString();
  return `${origin}${pathOf(view)}${query ? `#${query}` : ''}`;
}

/**
 * Reads an address such as `/tu-territorio#t=9-6&r=1010` (or the old `#/W-04?t=9-6&r=1010`).
 * Invalid parts are ignored, never guessed.
 */
export function parseSharedLocation(loc: { pathname: string; hash: string }): SharedLink {
  const legacy = loc.hash.startsWith('#/');
  const query = legacy ? (loc.hash.split('?')[1] ?? '') : loc.hash.replace(/^#/, '');
  const params = new URLSearchParams(query);
  const t = /^(\d{1,2})(?:-(\d{1,3}))?$/.exec(params.get('t') ?? '');
  const r = params.get('r');
  return {
    view: viewFromLocation(loc),
    territory: t
      ? {
          stateCode: Number(t[1]),
          ...(t[2] ? { municipalityCode: Number(t[2]) } : {}),
        }
      : null,
    answers: r ? decodeAnswers(r) : null,
  };
}

/** Whether a hash carries anything to restore. */
export const hasSharedState = (link: SharedLink) => Boolean(link.territory || link.answers);

/** The territory of a link, as the repository names it (null when it does not exist). */
export function findTerritory(
  link: LinkTerritory,
  states: readonly Territory[],
  municipalities: readonly Territory[],
): Territory | null {
  const st = states.find((s) => s.level === 'state' && s.stateCode === link.stateCode);
  if (!st) return null;
  if (link.municipalityCode === undefined) return st;
  const m = municipalities.find(
    (x) => x.level === 'municipality' && x.municipalityCode === link.municipalityCode,
  );
  return m ?? null;
}
