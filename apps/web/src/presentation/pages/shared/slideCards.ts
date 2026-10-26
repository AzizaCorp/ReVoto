// US-24 · Content of the share card of each story screen (W-03 to W-08 and W-10), in the style of
// a yearly «wrapped» story: one big figure, one sentence and the bars behind it. W-09, W-09b and
// W-09c share their identity cards (US-14). Only territorial figures: never personal data (RN-08).
import type { TerritoryStory } from '@/application';
import {
  AGE_GROUPS,
  ARCHETYPES,
  averageByType,
  changeBetween,
  gap,
  pointDifference,
  turnoutIn,
  type ElectionTurnout,
  type ElectionType,
  type ScreenId,
  type Territory,
} from '@/domain';
import { percent, place, points, pointsAbs } from '@/presentation/format';
import { breakdown, placeOf, YEAR } from './storyFigures';

/** Screens whose card is drawn from their figures. */
export const SLIDE_SCREENS = ['W-03', 'W-04', 'W-05', 'W-06', 'W-07', 'W-08', 'W-10'] as const;
export type SlideScreen = (typeof SLIDE_SCREENS)[number];

export const isSlideScreen = (id: ScreenId): id is SlideScreen =>
  (SLIDE_SCREENS as readonly ScreenId[]).includes(id);

/** One row of the card: a bar when it has a ratio, a plain figure otherwise. */
export interface SlideBar {
  readonly label: string;
  readonly value: string;
  /** 0–1 (turnout), or null for a row without bar (W-08 ranks, W-10 figures). */
  readonly ratio: number | null;
  readonly highlight?: boolean;
  /** RN-03: presidential and midterm bars differ by pattern, not only by color. */
  readonly kind?: ElectionType;
}

export interface SlideCardContent {
  readonly screen: SlideScreen;
  /** Small caps line in the chip: what and when, e.g. «MÉXICO VOTÓ · 2024». */
  readonly chip: string;
  readonly kicker: string;
  /** The big figure of the card. */
  readonly figure: string;
  readonly figureCaption: string;
  readonly title: string;
  readonly bars: readonly SlideBar[];
  /** Territory the figures belong to (RN-10). */
  readonly place: string;
  /** Period of the figures (RN-10), e.g. «2024» or «2009–2024». */
  readonly period: string;
  /** File name part, e.g. «tu-territorio». */
  readonly file: string;
  /** Text that goes with the image when it is shared. */
  readonly caption: string;
}

export type SlideCardResult =
  | { readonly status: 'ready'; readonly card: SlideCardContent }
  | {
      readonly status: 'missing';
      readonly reason: string;
      /** The person can fix it by choosing a territory. */
      readonly needs?: 'territory' | 'municipality';
    };

const TYPE_SHORT: Record<ElectionType, string> = { presidential: 'pres.', midterm: 'int.' };
const AGE_LABEL: Record<(typeof AGE_GROUPS)[number], string> = {
  '18-24': '18–24',
  '25-34': '25–34',
  '35-44': '35–44',
  '45-59': '45–59',
  '60+': '60 +',
};

const ready = (card: SlideCardContent): SlideCardResult => ({ status: 'ready', card });
const missing = (reason: string, needs?: 'territory' | 'municipality'): SlideCardResult => ({
  status: 'missing',
  reason,
  ...(needs ? { needs } : {}),
});

/** Bars of a 2009–2024 series, one per election, with the type in the label (RN-03). */
const seriesBars = (elections: readonly ElectionTurnout[]): SlideBar[] =>
  elections.map((e) => ({
    label: `${e.election.year} · ${TYPE_SHORT[e.election.type]}`,
    value: percent(e.total.value),
    ratio: e.total.value,
    kind: e.election.type,
    highlight: e.election.year === YEAR,
  }));

/**
 * Card of a story screen for the chosen territory. Returns why it cannot be drawn when the
 * figures are missing, so the share sheet never exports an empty card.
 */
export function slideCard(
  screen: SlideScreen,
  story: TerritoryStory | null,
  territory: Territory,
): SlideCardResult {
  if (!story) return missing('Estamos cargando las cifras de esta pantalla.');
  const name = story.own.territory.name;
  const where = place(story.own.territory);
  switch (screen) {
    case 'W-03': {
      const e = turnoutIn(story.national.elections, YEAR);
      if (!e) return missing('Aún no tenemos la participación nacional de 2024.');
      const change = changeBetween(story.national.elections, 2018, YEAR);
      return ready({
        screen,
        chip: `MÉXICO VOTÓ · ${YEAR}`,
        kicker: `EN ${YEAR}, MÉXICO VOTÓ…`,
        figure: percent(e.total.value),
        figureCaption: 'de su lista nominal, en la elección presidencial',
        title:
          change === null
            ? 'Así vota México'
            : `${points(change)} frente a la presidencial de 2018`,
        bars: seriesBars(story.national.elections),
        place: 'México',
        period: '2009–2024',
        file: 'mexico-voto',
        caption: `En ${YEAR} votó el ${percent(e.total.value)} de México. Míralo en ReVoto.`,
      });
    }
    case 'W-04': {
      if (territory.level === 'national')
        return missing(
          'Elige tu entidad o municipio para crear la tarjeta de tu territorio.',
          'territory',
        );
      const own = turnoutIn(story.own.elections, YEAR);
      const nat = turnoutIn(story.national.elections, YEAR);
      const st =
        story.state && territory.level === 'municipality'
          ? turnoutIn(story.state.elections, YEAR)
          : null;
      if (!own || !nat) return missing(`Aún no tenemos la participación de ${name} en ${YEAR}.`);
      const diff = pointDifference(own.total.value, nat.total.value);
      return ready({
        screen,
        chip: `TU TERRITORIO · ${YEAR}`,
        kicker: `EN ${YEAR}, ${name.toUpperCase()} VOTÓ…`,
        figure: percent(own.total.value),
        figureCaption: 'de su lista nominal',
        title:
          Math.abs(diff) < 0.05
            ? 'Igual que el país'
            : `${pointsAbs(diff)} ${diff > 0 ? 'más' : 'menos'} que el país`,
        bars: [
          { label: name, value: percent(own.total.value), ratio: own.total.value, highlight: true },
          ...(st && story.state
            ? [
                {
                  label: story.state.territory.name,
                  value: percent(st.total.value),
                  ratio: st.total.value,
                },
              ]
            : []),
          { label: 'México', value: percent(nat.total.value), ratio: nat.total.value },
        ],
        place: where,
        period: String(YEAR),
        file: 'tu-territorio',
        caption: `En ${YEAR} votó el ${percent(own.total.value)} de ${name}: ${points(diff)} frente al país.`,
      });
    }
    case 'W-05': {
      const list = story.own.elections;
      const pres = averageByType(list, 'presidential');
      const mid = averageByType(list, 'midterm');
      if (pres === null || mid === null)
        return missing(`${name} aún no tiene presidenciales e intermedias para compararlas.`);
      const diff = pointDifference(pres, mid);
      return ready({
        screen,
        chip: 'QUINCE AÑOS · 2009–2024',
        kicker: `EN ${name.toUpperCase()}, LAS ${diff >= 0 ? 'PRESIDENCIALES' : 'INTERMEDIAS'} SUMAN…`,
        figure: pointsAbs(diff),
        figureCaption: `más participación que las ${diff >= 0 ? 'intermedias' : 'presidenciales'}, en promedio`,
        title: `Presidenciales ${percent(pres)} vs. intermedias ${percent(mid)}`,
        bars: seriesBars(list),
        place: where,
        period: '2009–2024',
        file: 'quince-anos',
        caption: `En ${name}, las elecciones ${diff >= 0 ? 'presidenciales' : 'intermedias'} suman ${pointsAbs(diff)} más participación. Míralo en ReVoto.`,
      });
    }
    case 'W-06': {
      const b = breakdown(story, 'age', 'territory');
      const byAge = b.figures?.byAge ?? {};
      const g = gap(byAge['18-24'], byAge['60+']);
      if (g === null)
        return missing(`Aún no tenemos la participación por edad de ${b.territory.name}.`);
      return ready({
        screen,
        chip: `TU GENERACIÓN · ${YEAR}`,
        kicker: `ENTRE 18–24 Y 60 + HAY…`,
        figure: pointsAbs(g),
        figureCaption: 'de diferencia en participación',
        title: g < 0 ? 'Quienes tienen 60 + votan más' : 'Quienes tienen 18–24 votan más',
        bars: AGE_GROUPS.filter((a) => byAge[a] !== undefined).map((a) => ({
          label: AGE_LABEL[a],
          value: percent(byAge[a]!),
          ratio: byAge[a]!,
        })),
        place: place(b.territory),
        period: String(YEAR),
        file: 'tu-generacion',
        caption: `Entre quienes tienen 18–24 y 60 + hay ${pointsAbs(g)} de diferencia al votar en ${b.territory.name}.`,
      });
    }
    case 'W-07': {
      const b = breakdown(story, 'sex', 'territory');
      const m = b.figures?.bySex.M;
      const h = b.figures?.bySex.H;
      const g = gap(m, h);
      if (g === null || m === undefined || h === undefined)
        return missing(`Aún no tenemos la participación por sexo de ${b.territory.name}.`);
      return ready({
        screen,
        chip: `MUJERES Y HOMBRES · ${YEAR}`,
        kicker:
          g > 0 ? 'LAS MUJERES VOTAN…' : g < 0 ? 'LOS HOMBRES VOTAN…' : 'MUJERES Y HOMBRES VOTAN…',
        figure: g === 0 ? 'Igual' : pointsAbs(g),
        figureCaption: g > 0 ? 'más que los hombres' : g < 0 ? 'más que las mujeres' : 'lo mismo',
        title: `Mujeres ${percent(m)} vs. hombres ${percent(h)}`,
        bars: [
          { label: 'Mujeres', value: percent(m), ratio: m, highlight: g >= 0 },
          { label: 'Hombres', value: percent(h), ratio: h, highlight: g < 0 },
        ],
        place: place(b.territory),
        period: String(YEAR),
        file: 'mujeres-y-hombres',
        caption:
          g === 0
            ? `En ${b.territory.name}, mujeres y hombres votan lo mismo.`
            : `En ${b.territory.name}, ${g > 0 ? 'las mujeres' : 'los hombres'} votan ${pointsAbs(g)} más.`,
      });
    }
    case 'W-08': {
      if (territory.level !== 'municipality')
        return missing(
          'Elige un municipio para crear la tarjeta de su lugar en la entidad.',
          'municipality',
        );
      const p = placeOf(story);
      if (!p?.rank)
        return missing(
          `${territory.name} no tiene lugar en ${territory.stateName}: sus cifras no se publican.`,
        );
      const own = turnoutIn(story.own.elections, YEAR);
      const inTop = p.top.slice(0, 3).some((m) => m.name === territory.name);
      return ready({
        screen,
        chip: `TU LUGAR · ${YEAR}`,
        kicker: `EN ${territory.stateName.toUpperCase()}, ${territory.name.toUpperCase()} ES…`,
        figure: `#${p.rank.position}`,
        figureCaption: `de ${p.rank.total} municipios por participación`,
        title: `Vota más que el ${Math.round(p.rank.aheadOf * 100)} % de los municipios de ${territory.stateName}`,
        bars: [
          ...p.top.slice(0, 3).map((m, i) => ({
            label: `#${i + 1} ${m.name}`,
            value: m.turnout === null ? '—' : percent(m.turnout),
            ratio: m.turnout,
            highlight: m.name === territory.name,
          })),
          ...(inTop
            ? []
            : [
                {
                  label: `#${p.rank.position} ${territory.name}`,
                  value: own ? percent(own.total.value) : '—',
                  ratio: own?.total.value ?? null,
                  highlight: true,
                },
              ]),
        ],
        place: place(territory),
        period: String(YEAR),
        file: 'tu-lugar',
        caption: `${territory.name} es #${p.rank.position} de ${p.rank.total} municipios de ${territory.stateName} en participación.`,
      });
    }
    case 'W-10': {
      const nat = turnoutIn(story.national.elections, YEAR);
      if (!nat) return missing('Aún no tenemos las cifras de tu resumen.');
      const own = territory.level === 'national' ? null : turnoutIn(story.own.elections, YEAR);
      const rank = placeOf(story)?.rank;
      const age = breakdown(story, 'age', 'territory');
      const sex = breakdown(story, 'sex', 'territory');
      const ageGap = gap(age.figures?.byAge['18-24'], age.figures?.byAge['60+']);
      const sexGap = gap(sex.figures?.bySex.M, sex.figures?.bySex.H);
      const archetype = story.profile?.archetype?.archetype;
      const main = own ?? nat;
      const rows: SlideBar[] = [
        ...(own
          ? [{ label: name, value: percent(own.total.value), ratio: null, highlight: true }]
          : []),
        { label: 'México', value: percent(nat.total.value), ratio: null },
        ...(rank && territory.level === 'municipality'
          ? [
              {
                label: `Lugar en ${territory.stateName}`,
                value: `#${rank.position} de ${rank.total}`,
                ratio: null,
              },
            ]
          : []),
        ...(ageGap === null
          ? []
          : [{ label: '18–24 vs. 60 +', value: points(ageGap), ratio: null }]),
        ...(sexGap === null
          ? []
          : [{ label: 'Mujeres vs. hombres', value: points(sexGap), ratio: null }]),
        ...(archetype ? [{ label: 'Arquetipo', value: ARCHETYPES[archetype], ratio: null }] : []),
      ];
      return ready({
        screen,
        chip: 'MI RESUMEN · 2009–2024',
        kicker: `EN ${YEAR}, ${(own ? name : 'MÉXICO').toUpperCase()} VOTÓ…`,
        figure: percent(main.total.value),
        figureCaption: 'de su lista nominal',
        title: 'Lo esencial de mi recorrido en ReVoto',
        bars: rows,
        place: own ? where : 'México',
        period: '2009–2024',
        file: 'mi-resumen',
        caption: `Mi resumen de ReVoto: en ${YEAR} votó el ${percent(main.total.value)} de ${own ? name : 'México'}.`,
      });
    }
  }
}
