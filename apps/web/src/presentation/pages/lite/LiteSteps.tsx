import { useState, type ReactNode } from 'react';
import { listMunicipalities, listStates, type TerritoryStory } from '@/application';
import {
  AGE_GROUPS,
  ARCHETYPES,
  averageByType,
  averageTurnout,
  BADGES,
  changeBetween,
  gap,
  NATIONAL,
  pointDifference,
  turnoutIn,
  type BadgeId,
  type ElectionTurnout,
  type ScreenId,
  type Territory,
} from '@/domain';
import { CROSSINGS } from '@/presentation/components/organisms/IdentityCard/crossings';
import { count, percent as pct, place, points, pointsAbs } from '@/presentation/format';
import { useAsync } from '@/presentation/hooks/useAsync';
import { useDependencies } from '@/presentation/providers/Dependencies';
import { QUESTIONS, type Answers, type QuestionKey } from '@/presentation/providers/Profile';
import { ageGroupOfAnswer, breakdown, placeOf, traitSentence, YEAR } from '../shared/storyFigures';
import { LiteFacts, LiteTable } from './LiteTable';
import styles from './Lite.module.css';

const TYPE = { presidential: 'Presidencial', midterm: 'Intermedia' } as const;

const P = '—.— %';
const YEARS = [
  ['2009', 'Intermedia'],
  ['2012', 'Presidencial'],
  ['2015', 'Intermedia'],
  ['2018', 'Presidencial'],
  ['2021', 'Intermedia'],
  ['2024', 'Presidencial'],
] as const;
const AGES = ['18–24', '25–34', '35–44', '45–59', '60 +'] as const;

/** What a lite step needs from the page: lite navigation, the full version and the profile. */
export interface LiteContext {
  /** Moves inside the lite version. */
  show: (id: ScreenId) => void;
  /** Leaves the lite version for an auxiliary view (open data, methodology). */
  open: (view: 'W-16' | 'W-18') => void;
  /** Tablet and desktop: the 15-year table adds the state column (board TL05/DL05). */
  wide: boolean;
  answers: Answers;
  answer: (key: QuestionKey, value: string) => void;
  badge: BadgeId | null;
  votes: number;
  /** Chosen territory and its data (null while loading). */
  territory: Territory;
  story: TerritoryStory | null;
  choose: (t: Territory) => void;
}

/** «1.7 de 3» for the age of the person in the chosen state (W-09b). */
const expectedOf = (c: LiteContext) => {
  const g = ageGroupOfAnswer(c.answers.age);
  const v = g ? c.story?.overview?.expectedVotes[g] : undefined;
  return v === undefined ? '—.— de 3' : `${v.toFixed(1)} de 3`;
};

export interface LiteStep {
  /** Short name after «Pantalla N de 10». */
  label: string;
  title: string;
  /** Shows «[Municipio], [Entidad] · cambiar» (from W-03 on). */
  territory: boolean;
  /** Shows the INE source line (data screens). */
  source: boolean;
  body: ReactNode;
}

function TerritoryForm({ onDone }: { onDone: (t: Territory) => void }) {
  const { turnout } = useDependencies();
  const [stateCode, setStateCode] = useState('');
  const [town, setTown] = useState('');
  const states = useAsync(() => listStates(turnout), [turnout]);
  const towns = useAsync(
    () => (stateCode ? listMunicipalities(turnout, Number(stateCode)) : Promise.resolve([])),
    [turnout, stateCode],
  );
  const stateList = states.status === 'ready' ? states.data : [];
  const townList = towns.status === 'ready' ? towns.data : [];
  const code = (t: Territory) =>
    t.level === 'municipality' ? t.key : t.level === 'state' ? String(t.stateCode) : '';
  const chosen =
    townList.find((t) => code(t) === town) ??
    stateList.find((t) => code(t) === stateCode) ??
    NATIONAL;
  return (
    <>
      <p className={styles.meta}>
        Elige tu entidad y municipio para comparar sus cifras con las del país. No guardamos tu
        elección.
      </p>
      <label className={styles.field}>
        Entidad
        <select
          value={stateCode}
          onChange={(e) => {
            setStateCode(e.target.value);
            setTown('');
          }}
        >
          <option value="">
            {states.status === 'loading' ? 'Cargando…' : 'Elige una entidad'}
          </option>
          {stateList.map((t) => (
            <option key={code(t)} value={code(t)}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        Municipio
        <select
          value={town}
          disabled={!stateCode || towns.status !== 'ready'}
          onChange={(e) => setTown(e.target.value)}
        >
          <option value="">{stateCode ? 'Elige un municipio' : 'Primero elige una entidad'}</option>
          {townList.map((t) => (
            <option key={code(t)} value={code(t)}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <div className={styles.row}>
        <button type="button" className={styles.button} onClick={() => onDone(chosen)}>
          Continuar
        </button>
        <button type="button" className={styles.strongLink} onClick={() => onDone(NATIONAL)}>
          Usar cifras nacionales
        </button>
      </div>
    </>
  );
}

/** Content of each sequence screen in the lite version (RF-18): the same story in text and tables. */
export function liteStep(id: ScreenId, c: LiteContext): LiteStep {
  const s = c.story;
  switch (id) {
    case 'W-01':
      return {
        label: 'Inicio',
        title: '¿Cuánto vota tu territorio?',
        territory: false,
        source: false,
        body: (
          <>
            <p className={styles.intro}>
              Descubre en 10 pantallas cómo vota tu municipio frente al país. Sin datos personales.
            </p>
            <ol className={styles.toc}>
              <li>Elige tu territorio</li>
              <li>Así vota México</li>
              <li>Tu territorio</li>
              <li>15 años de elecciones</li>
              <li>Tu generación</li>
              <li>Mujeres y hombres</li>
              <li>Tu lugar en tu entidad</li>
              <li>Tu arquetipo, tu insignia y los dos juntos</li>
              <li>Tu resumen</li>
            </ol>
            <button type="button" className={styles.button} onClick={() => c.show('W-02')}>
              Empezar ›
            </button>
          </>
        ),
      };
    case 'W-02':
      return {
        label: 'Territorio',
        title: '¿Dónde votas?',
        territory: false,
        source: false,
        body: (
          <TerritoryForm
            onDone={(t) => {
              c.choose(t);
              c.show('W-02b');
            }}
          />
        ),
      };
    case 'W-02b':
      return {
        label: 'Sobre ti (opcional)',
        title: 'Cuéntanos de ti',
        territory: false,
        source: false,
        body: (
          <>
            <p className={styles.meta}>
              4 respuestas para darte tu insignia. Se quedan en tu teléfono: no las guardamos ni las
              enviamos.
            </p>
            {QUESTIONS.map((q) => (
              <fieldset key={q.key} className={styles.fieldset}>
                <legend>{q.text.replace(/^\d+\.\s*/, '')}</legend>
                <div className={styles.options}>
                  {q.options.map((o) => (
                    <label key={o} className={styles.option}>
                      <input
                        type="radio"
                        name={`lite-${q.key}`}
                        checked={c.answers[q.key] === o}
                        onChange={() => c.answer(q.key, o)}
                      />
                      {o}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <button type="button" className={styles.strongLink} onClick={() => c.show('W-03')}>
              Saltar
            </button>
          </>
        ),
      };
    case 'W-03': {
      const rows = s?.national.elections ?? [];
      return {
        label: 'México',
        title: 'Así vota México',
        territory: true,
        source: true,
        body: (
          <>
            <LiteTable
              caption="Participación nacional por elección federal"
              head={['Año', 'Tipo', 'Nacional']}
              rows={
                rows.length
                  ? rows.map((e) => [
                      String(e.election.year),
                      TYPE[e.election.type],
                      pct(e.total.value),
                    ])
                  : YEARS.map(([y, t]) => [y, t, P])
              }
              numericFrom={2}
            />
            <p className={styles.note}>
              El mapa por municipio no se muestra en esta versión. Tu municipio aparece en la
              siguiente pantalla.
            </p>
          </>
        ),
      };
    }
    case 'W-04': {
      const own = s ? turnoutIn(s.own.elections, YEAR) : null;
      const st = s?.state ? turnoutIn(s.state.elections, YEAR) : null;
      const nat = s ? turnoutIn(s.national.elections, YEAR) : null;
      const neighbours =
        s?.overview && s.profile
          ? averageTurnout(
              s.overview.municipalities.map((m) => ({
                code: m.municipality.key,
                name: m.municipality.name,
                turnout: m.suppressed ? null : (m.turnout[YEAR] ?? null),
              })),
              s.profile.neighbours,
            )
          : null;
      const rows: string[][] = [[c.territory.name, own ? pct(own.total.value) : P]];
      if (c.territory.level === 'municipality')
        rows.push([c.territory.stateName, st ? pct(st.total.value) : P]);
      if (c.territory.level !== 'national') rows.push(['Nacional', nat ? pct(nat.total.value) : P]);
      if (neighbours !== null) rows.push(['Tus vecinos (promedio)', pct(neighbours)]);
      const diff = own && nat ? pointDifference(own.total.value, nat.total.value) : null;
      return {
        label: 'Tu territorio',
        title: place(c.territory),
        territory: true,
        source: true,
        body: (
          <>
            <p className={styles.meta}>
              Elección federal {YEAR} · lista nominal {own ? count(own.registeredVoters) : '[n]'}{' '}
              personas
            </p>
            <LiteTable
              caption={`Participación comparada · ${YEAR}`}
              head={['Territorio', 'Participación']}
              rows={rows}
              highlight={c.territory.name}
            />
            {c.territory.level !== 'national' && (
              <p className={styles.big}>
                {diff === null ? '± —.— pts' : points(diff)} frente al país
              </p>
            )}
          </>
        ),
      };
    }
    case 'W-05': {
      const own = s?.own.elections ?? [];
      const st = s?.state && c.territory.level === 'municipality' ? s.state.elections : null;
      const nat = s?.national.elections ?? [];
      const v = (list: readonly ElectionTurnout[], y: number) => {
        const e = list.find((x) => x.election.year === y);
        return e ? pct(e.total.value) : P;
      };
      const pres = averageByType(own, 'presidential');
      const mid = averageByType(own, 'midterm');
      const change = changeBetween(own, 2018, 2024);
      const diff = pres !== null && mid !== null ? pointDifference(pres, mid) : null;
      const wideState = c.wide && st;
      return {
        label: '2009–2024',
        title:
          diff === null
            ? '[Mensaje sobre presidenciales e intermedias]'
            : diff >= 0
              ? `De 2009 a 2024, en presidenciales se vota ${pointsAbs(diff)} más que en intermedias`
              : `De 2009 a 2024, en intermedias se vota ${pointsAbs(diff)} más que en presidenciales`,
        territory: true,
        source: true,
        body: (
          <>
            <LiteTable
              caption={`Participación por elección federal · ${s ? place(s.own.territory) : '[Territorio]'}`}
              head={[
                'Año',
                'Tipo',
                ...(wideState
                  ? [c.territory.name, (c.territory as { stateName: string }).stateName, 'Nacional']
                  : ['Territorio', 'Nacional']),
              ]}
              rows={YEARS.map(([y, t]) => [
                y,
                t,
                v(own, Number(y)),
                ...(wideState ? [v(st, Number(y))] : []),
                v(nat, Number(y)),
              ])}
              numericFrom={2}
            />
            <LiteFacts
              items={[
                ['Promedio presidencial', pres === null ? P : pct(pres)],
                ['Promedio intermedia', mid === null ? P : pct(mid)],
                [
                  'Cambio entre las dos últimas presidenciales',
                  change === null ? '± —.— pts' : points(change),
                ],
              ]}
            />
          </>
        ),
      };
    }
    case 'W-06': {
      const b = s ? breakdown(s, 'age', 'territory') : null;
      const n = s ? turnoutIn(s.national.elections, YEAR) : null;
      const byAge = b?.figures?.byAge ?? {};
      const g = gap(byAge['18-24'], byAge['60+']);
      return {
        label: 'Tu generación',
        title:
          g === null
            ? '[Mensaje sobre la participación por edad]'
            : g < 0
              ? `Quienes tienen 60 + votan ${pointsAbs(g)} más que quienes tienen 18–24`
              : `Quienes tienen 18–24 votan ${pointsAbs(g)} más que quienes tienen 60 +`,
        territory: true,
        source: true,
        body: (
          <>
            <LiteTable
              caption={`Participación por grupo de edad · ${YEAR}`}
              head={
                b?.territory.level === 'national'
                  ? ['Grupo de edad', 'Nacional']
                  : ['Grupo de edad', b ? b.territory.name : 'Territorio', 'Nacional']
              }
              rows={AGE_GROUPS.map((a, i) => [
                AGES[i]!,
                byAge[a] === undefined ? P : pct(byAge[a]),
                ...(b?.territory.level === 'national'
                  ? []
                  : [n?.byAge[a] === undefined ? P : pct(n.byAge[a])]),
              ])}
            />
            <p className={styles.big}>
              Brecha 18–24 vs. 60 +: {g === null ? '—.— pts' : points(g)}
            </p>
            {b?.fromState && (
              <p className={styles.note}>
                Por ahora la edad se publica por entidad: mostramos {b.territory.name}.
              </p>
            )}
          </>
        ),
      };
    }
    case 'W-07': {
      const b = s ? breakdown(s, 'sex', 'territory') : null;
      const bySex = b?.figures?.bySex ?? {};
      const g = gap(bySex.M, bySex.H);
      return {
        label: 'Mujeres y hombres',
        title:
          g === null
            ? '[Mensaje sobre la participación por sexo]'
            : g > 0
              ? `Las mujeres votan ${pointsAbs(g)} más que los hombres`
              : g < 0
                ? `Los hombres votan ${pointsAbs(g)} más que las mujeres`
                : 'Mujeres y hombres votan lo mismo',
        territory: true,
        source: true,
        body: (
          <>
            <LiteTable
              caption={`Participación por sexo · ${b ? place(b.territory) : '[Territorio]'} · ${YEAR}`}
              head={['Sexo', 'Participación']}
              rows={[
                ['Mujeres', bySex.M === undefined ? P : pct(bySex.M)],
                ['Hombres', bySex.H === undefined ? P : pct(bySex.H)],
              ]}
            />
            <p className={styles.big}>
              Diferencia entre mujeres y hombres: {g === null ? '—.— pts' : points(g)}
            </p>
            <p className={styles.note}>
              No se cuentan los registros sin sexo registrado como hombre o mujer.
            </p>
          </>
        ),
      };
    }
    case 'W-08': {
      const p = s ? placeOf(s) : null;
      const t = c.territory;
      const stateName =
        t.level === 'municipality' ? t.stateName : t.level === 'state' ? t.name : '[Entidad]';
      const mine = t.level === 'municipality' ? t.name : null;
      const rows =
        p?.top.map((m, i) => [String(i + 1), m.name, m.turnout === null ? '—' : pct(m.turnout)]) ??
        [];
      if (p?.rank && mine && !p.top.some((m) => m.name === mine)) {
        const own = s ? turnoutIn(s.own.elections, YEAR) : null;
        rows.push([`#${p.rank.position}`, mine, own ? pct(own.total.value) : '—']);
      }
      return {
        label: 'Tu lugar',
        title: `Tu lugar en ${stateName}`,
        territory: true,
        source: true,
        body:
          t.level !== 'municipality' ? (
            <>
              <p className={styles.meta}>
                Elige un municipio para ver su lugar entre los de su entidad.
              </p>
              <button type="button" className={styles.button} onClick={() => c.show('W-02')}>
                Elegir municipio
              </button>
            </>
          ) : (
            <>
              <p className={styles.big}>
                {p?.rank
                  ? `#${p.rank.position} de ${p.rank.total} municipios · vota más que el ${Math.round(p.rank.aheadOf * 100)} % de los municipios de ${stateName}`
                  : `#— de [n] municipios de ${stateName}`}
              </p>
              <LiteTable
                caption={`Mayor participación en ${stateName} · ${YEAR}`}
                head={['Lugar', 'Municipio', 'Participación']}
                rows={rows}
                numericFrom={2}
                highlight={
                  p?.rank && rows.at(-1)?.[1] === mine
                    ? rows.at(-1)?.[0]
                    : String(p?.rank?.position)
                }
              />
            </>
          ),
      };
    }
    case 'W-09': {
      const a = s?.profile?.archetype ?? null;
      const t = c.territory;
      return {
        label: 'Tu arquetipo',
        title:
          a && t.level === 'municipality'
            ? `${t.name} es «${ARCHETYPES[a.archetype]}»`
            : 'El arquetipo de tu municipio',
        territory: true,
        source: true,
        body: (
          <>
            <p className={styles.meta}>
              Agrupamos los 2,477 municipios por cómo han votado de 2009 a 2024: su nivel, su
              tendencia, cuánto suben en presidenciales y qué tan predecibles son.
            </p>
            {a ? (
              <>
                <p className={styles.big}>{traitSentence(a)}</p>
                <LiteFacts
                  items={[
                    ['Nivel frente al país', points(a.level)],
                    ['Efecto presidencial', points(a.presidentialEffect)],
                    ['Tendencia', `${points(a.trend)} por década`],
                    ['Volatilidad', pointsAbs(a.volatility)],
                    ['Qué tan típico', a.typicality.toFixed(2)],
                  ]}
                />
              </>
            ) : (
              <p className={styles.note}>
                {t.level === 'municipality'
                  ? `${t.name} tiene menos de 5 elecciones para calcular su arquetipo.`
                  : 'Elige un municipio para conocer su arquetipo.'}
              </p>
            )}
            <p className={styles.note}>
              Los 5 arquetipos: Siempre presente, En ascenso, Montaña rusa, De elección grande y
              Bajando el ritmo.
            </p>
          </>
        ),
      };
    }
    case 'W-09b':
      return {
        label: 'Tu insignia',
        title: c.badge ? `Tu insignia: «${BADGES[c.badge]}»` : 'Aún sin insignia',
        territory: true,
        source: true,
        body: c.badge ? (
          <>
            <p className={styles.meta}>
              Sale de tus respuestas; la comparación, de la participación del INE para tu edad en tu
              entidad.
            </p>
            <LiteTable
              caption="Elecciones con voto, de 3 (2018, 2021 y 2024)"
              head={['Quién', 'Votos']}
              rows={[
                ['Tú', `${c.votes} de 3`],
                [
                  `${c.answers.age ?? '[Edad]'} en ${c.story?.overview?.state.name ?? '[Entidad]'}`,
                  expectedOf(c),
                ],
              ]}
              highlight="Tú"
            />
            <button type="button" className={styles.strongLink} onClick={() => c.show('W-02b')}>
              Cambiar respuestas
            </button>
          </>
        ) : (
          <>
            <p className={styles.meta}>
              Tu insignia sale de 3 respuestas sobre 2018, 2021 y 2024. Se quedan en tu teléfono.
            </p>
            <LiteTable
              caption="Elecciones con voto, de 3 (2018, 2021 y 2024)"
              head={['Quién', 'Votos']}
              rows={[
                ['Tú', 'Sin respuesta'],
                [`[Edad] en ${c.story?.overview?.state.name ?? '[Entidad]'}`, '—.— de 3'],
              ]}
              highlight="Tú"
            />
            <button type="button" className={styles.button} onClick={() => c.show('W-02b')}>
              Responder «Sobre ti»
            </button>
          </>
        ),
      };
    case 'W-09c': {
      const a = s?.profile?.archetype ?? null;
      const name = a ? ARCHETYPES[a.archetype] : '[Arquetipo]';
      const crossing = a && c.badge ? CROSSINGS[c.badge][a.archetype] : null;
      const text = c.badge
        ? `Mi municipio es «${name}»; yo, «${BADGES[c.badge]}».`
        : `Mi municipio es «${name}»; falta mi parte.`;
      return {
        label: 'Mi municipio y yo',
        title: crossing
          ? `«${crossing.title.replace('\u00ad', '')}»`
          : c.badge
            ? '«[Titular del cruce]»'
            : 'Tu municipio ya tiene su mitad',
        territory: true,
        source: false,
        body: (
          <>
            <p className={styles.big}>{text}</p>
            {c.badge ? (
              <p className={styles.meta}>
                {crossing?.phrase ?? 'Elige un municipio con arquetipo para ver el cruce.'}
              </p>
            ) : (
              <button type="button" className={styles.strongLink} onClick={() => c.show('W-02b')}>
                Responder «Sobre ti» para completar la tarjeta
              </button>
            )}
            <button
              type="button"
              className={styles.button}
              onClick={() =>
                void navigator.clipboard?.writeText(
                  crossing
                    ? `${crossing.title.replace('\u00ad', '')}. ${crossing.phrase} ${text}`
                    : text,
                )
              }
            >
              Copiar texto
            </button>
          </>
        ),
      };
    }
    case 'W-10': {
      const t = c.territory;
      const nat = s ? turnoutIn(s.national.elections, YEAR) : null;
      const own = s ? turnoutIn(s.own.elections, YEAR) : null;
      const rank = s ? placeOf(s)?.rank : null;
      const age = s ? breakdown(s, 'age', 'territory') : null;
      const sex = s ? breakdown(s, 'sex', 'territory') : null;
      const ageGap = gap(age?.figures?.byAge['18-24'], age?.figures?.byAge['60+']);
      const sexGap = gap(sex?.figures?.bySex.M, sex?.figures?.bySex.H);
      const a = s?.profile?.archetype ?? null;
      const rows: string[][] = [['Participación nacional', nat ? pct(nat.total.value) : P]];
      if (t.level !== 'national')
        rows.push([s?.own.territory.name ?? t.name, own ? pct(own.total.value) : P]);
      if (t.level === 'municipality') {
        rows.push([
          `Tu lugar en ${t.stateName}`,
          rank ? `#${rank.position} de ${rank.total}` : '#— de [n]',
        ]);
      }
      rows.push([
        `Brecha 18–24 vs. 60 + (${age?.territory.name ?? '—'})`,
        ageGap === null ? '—.— pts' : points(ageGap),
      ]);
      rows.push([
        `Mujeres vs. hombres (${sex?.territory.name ?? '—'})`,
        sexGap === null ? '—.— pts' : points(sexGap),
      ]);
      return {
        label: 'Resumen',
        title: `Lo esencial, en ${['', '', '', 'tres', 'cuatro', 'cinco'][rows.length]} cifras`,
        territory: true,
        source: true,
        body: (
          <>
            <LiteTable caption={`Tus cifras · ${YEAR}`} head={['Cifra', 'Valor']} rows={rows} />
            <p className={styles.meta}>
              Tu municipio: «{a ? ARCHETYPES[a.archetype] : 'sin arquetipo'}» · Tú: «
              {c.badge ? BADGES[c.badge] : 'Aún sin insignia'}»
            </p>
            <p className={styles.meta}>
              <button type="button" className={styles.link} onClick={() => c.open('W-16')}>
                Datos abiertos
              </button>
              {' · '}
              <button type="button" className={styles.link} onClick={() => c.open('W-18')}>
                Metodología
              </button>
              {' · '}
              <button type="button" className={styles.link} onClick={() => c.show('W-01')}>
                Volver a empezar
              </button>
            </p>
          </>
        ),
      };
    }
  }
}
