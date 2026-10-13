import { useState, type ReactNode } from 'react';
import { BADGES, type BadgeId, type ScreenId } from '@/domain';
import { QUESTIONS, type Answers, type QuestionKey } from '@/presentation/providers/Profile';
import { STATES } from '../shared/states';
import { LiteFacts, LiteTable } from './LiteTable';
import styles from './Lite.module.css';

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
}

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

function TerritoryForm({ onDone }: { onDone: () => void }) {
  const [state, setState] = useState('');
  return (
    <>
      <p className={styles.meta}>
        Elige tu entidad y municipio para comparar sus cifras con las del país. No guardamos tu
        elección.
      </p>
      <label className={styles.field}>
        Entidad
        <select value={state} onChange={(e) => setState(e.target.value)}>
          <option value="">Elige una entidad</option>
          {STATES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        Municipio
        <select disabled={!state} defaultValue="">
          <option value="">
            {state ? 'Municipios pendientes (US-11)' : 'Primero elige una entidad'}
          </option>
        </select>
      </label>
      <div className={styles.row}>
        <button type="button" className={styles.button} onClick={onDone}>
          Continuar
        </button>
        <button type="button" className={styles.strongLink} onClick={onDone}>
          Usar cifras nacionales
        </button>
      </div>
    </>
  );
}

/** Content of each sequence screen in the lite version (RF-18): the same story in text and tables. */
export function liteStep(id: ScreenId, c: LiteContext): LiteStep {
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
        body: <TerritoryForm onDone={() => c.show('W-02b')} />,
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
    case 'W-03':
      return {
        label: 'México',
        title: 'Así vota México',
        territory: true,
        source: true,
        body: (
          <>
            <LiteTable
              caption="Participación nacional por elección federal (datos pendientes)"
              head={['Año', 'Tipo', 'Nacional']}
              rows={YEARS.map(([y, t]) => [y, t, P])}
              numericFrom={2}
            />
            <p className={styles.note}>
              El mapa por municipio no se muestra en esta versión. Tu municipio aparece en la
              siguiente pantalla.
            </p>
          </>
        ),
      };
    case 'W-04':
      return {
        label: 'Tu territorio',
        title: '[Municipio], [Entidad]',
        territory: true,
        source: true,
        body: (
          <>
            <p className={styles.meta}>Elección federal [año] · lista nominal [n] personas</p>
            <LiteTable
              caption="Participación comparada · [año] (datos pendientes)"
              head={['Territorio', 'Participación']}
              rows={[
                ['[Municipio]', P],
                ['[Entidad]', P],
                ['Nacional', P],
                ['Tus vecinos (promedio)', P],
              ]}
              highlight="[Municipio]"
            />
            <p className={styles.big}>± —.— pts frente al país</p>
          </>
        ),
      };
    case 'W-05':
      return {
        label: '15 años',
        title: '[Mensaje sobre presidenciales e intermedias]',
        territory: true,
        source: true,
        body: (
          <>
            <LiteTable
              caption="Participación por elección federal (datos pendientes)"
              head={[
                'Año',
                'Tipo',
                ...(c.wide ? ['Municipio', 'Entidad', 'Nacional'] : ['Territorio', 'Nacional']),
              ]}
              rows={YEARS.map(([y, t]) => [y, t, ...(c.wide ? [P, P, P] : [P, P])])}
              numericFrom={2}
            />
            <LiteFacts
              items={[
                ['Promedio presidencial', P],
                ['Promedio intermedia', P],
                ['De 2018 a 2024', '± —.— pts'],
              ]}
            />
          </>
        ),
      };
    case 'W-06':
      return {
        label: 'Tu generación',
        title: '[Mensaje sobre la participación por edad]',
        territory: true,
        source: true,
        body: (
          <>
            <LiteTable
              caption="Participación por grupo de edad · [año] (datos pendientes)"
              head={['Grupo de edad', 'Territorio', 'Nacional']}
              rows={AGES.map((g) => [g, P, P])}
            />
            <p className={styles.big}>Brecha 18–24 vs. 60 +: —.— pts</p>
            <p className={styles.meta}>
              [Texto descriptivo de la brecha entre el grupo más joven y el mayor, sin juicios.]
            </p>
          </>
        ),
      };
    case 'W-07':
      return {
        label: 'Mujeres y hombres',
        title: '[Mensaje sobre la participación por sexo]',
        territory: true,
        source: true,
        body: (
          <>
            <LiteTable
              caption="Participación por sexo · [Territorio] · [año] (datos pendientes)"
              head={['Sexo', 'Participación']}
              rows={[
                ['Mujeres', P],
                ['Hombres', P],
              ]}
            />
            <p className={styles.big}>Diferencia entre mujeres y hombres: —.— pts</p>
            <p className={styles.note}>Se excluyen registros con sexo fuera de catálogo (RN-06).</p>
          </>
        ),
      };
    case 'W-08':
      return {
        label: 'Tu lugar',
        title: 'Tu lugar en [Entidad]',
        territory: true,
        source: true,
        body: (
          <>
            <p className={styles.big}>
              #— de [n] municipios · vota más que el —— % de los municipios de [Entidad]
            </p>
            <LiteTable
              caption="Mayor participación en [Entidad] · [año] (datos pendientes)"
              head={['Lugar', 'Municipio', 'Participación']}
              rows={[
                ...[1, 2, 3, 4, 5].map((n) => [String(n), '[Municipio]', P]),
                ['#—', '[Tu municipio]', P],
              ]}
              numericFrom={2}
              highlight="#—"
            />
          </>
        ),
      };
    case 'W-09':
      return {
        label: 'Tu arquetipo',
        title: '[Municipio] es «[Arquetipo]»',
        territory: true,
        source: true,
        body: (
          <>
            <p className={styles.meta}>
              Agrupamos los 2,477 municipios por cómo han votado de 2009 a 2024: su nivel, su
              tendencia, cuánto suben en presidenciales y qué tan predecibles son.
            </p>
            <LiteFacts
              items={[
                ['Nivel frente al país', '± —.— pts'],
                ['Efecto presidencial', '+—.— pts'],
                ['Tendencia', '—.— pts por década'],
                ['Volatilidad', '—.— pts'],
                ['Qué tan típico', '—.—'],
              ]}
            />
            <p className={styles.note}>
              Los 5 arquetipos: Siempre presente, En ascenso, Montaña rusa, De elección grande y
              Bajando el ritmo.
            </p>
          </>
        ),
      };
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
                [`${c.answers.age ?? '[Edad]'} en [Entidad]`, '—.— de 3'],
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
                ['[Edad] en [Entidad]', '—.— de 3'],
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
      const text = c.badge
        ? `Mi municipio es «[Arquetipo]»; yo, «${BADGES[c.badge]}».`
        : 'Mi municipio es «[Arquetipo]»; falta mi parte.';
      return {
        label: 'Mi municipio y yo',
        title: c.badge ? '«[Titular del cruce]»' : 'Tu municipio ya tiene su mitad',
        territory: true,
        source: false,
        body: (
          <>
            <p className={styles.big}>{text}</p>
            {c.badge ? (
              <p className={styles.meta}>[Frase del cruce en primera persona]</p>
            ) : (
              <button type="button" className={styles.strongLink} onClick={() => c.show('W-02b')}>
                Responder «Sobre ti» para completar la tarjeta
              </button>
            )}
            <button
              type="button"
              className={styles.button}
              onClick={() => void navigator.clipboard?.writeText(text)}
            >
              Copiar texto
            </button>
          </>
        ),
      };
    }
    case 'W-10':
      return {
        label: 'Resumen',
        title: 'Lo esencial, en cinco cifras',
        territory: true,
        source: true,
        body: (
          <>
            <LiteTable
              caption="Tus cinco cifras · [año] (datos pendientes)"
              head={['Cifra', 'Valor']}
              rows={[
                ['Participación nacional', P],
                ['[Municipio]', P],
                ['Tu lugar en [Entidad]', '#— de [n]'],
                ['Brecha 18–24 vs. 60 +', '—.— pts'],
                ['Mujeres vs. hombres', '—.— pts'],
              ]}
            />
            <p className={styles.meta}>
              Tu municipio: «[Arquetipo]» · Tú: «{c.badge ? BADGES[c.badge] : 'Aún sin insignia'}»
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
