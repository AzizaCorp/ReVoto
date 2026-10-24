import { useEffect, type CSSProperties } from 'react';
import { ARCHETYPES, BADGES, type ArchetypeId, type BadgeId } from '@/domain';
import { Logo } from '../../atoms';
import { ARCHETYPE_STAT, CROSSINGS, headlineSize } from './crossings';
import { registerCardFonts } from './fonts';
import { SITE } from './site';
import { IdentityArt } from './IdentityArt';
import { ARCHETYPE_THEMES, BADGE_THEMES, type CardTheme } from './themes';
import styles from './DuoCard.module.css';

export interface DuoCardProps {
  /** `null` while the municipality has no archetype (none chosen, or under 5 elections). */
  archetype: ArchetypeId | null;
  /** `null` while «Sobre ti» is unanswered: the «yo» half is an empty slot. */
  badge: BadgeId | null;
  /** 9:16 story or 1:1 post (the compact card of the mobile screen). */
  format?: 'story' | 'post';
  /** Line of the person, e.g. «2 de 3 · tu generación en Ciudad de México: 1.8 de 3». */
  you?: string;
  /** Without it the municipality half is a preview of the archetype («Un municipio es…»). */
  place?: string;
  /** Formatted figure of the archetype, e.g. «+11.0 pts»; replaces the «—.—» of the design. */
  figure?: string;
}

interface HalfProps {
  theme: CardTheme;
  label: string;
  name: string;
  nameScale: number;
  stat: string;
  vertical: boolean;
}

function Half({ theme, label, name, nameScale, stat, vertical }: HalfProps) {
  const vars = {
    '--half-bg': theme.background,
    '--half-ink': theme.ink,
    '--half-sub': theme.sub,
    '--half-stat': theme.statColor,
    '--half-font': theme.font,
    '--half-weight': theme.weight,
    '--half-style': theme.italic ? 'italic' : 'normal',
    '--half-case': theme.uppercase ? 'uppercase' : 'none',
    '--half-name': theme.nameSize * nameScale,
  } as CSSProperties;
  return (
    <div
      className={[styles.half, vertical ? styles.vertical : styles.horizontal, styles.t].join(' ')}
      style={vars}
    >
      {vertical && <IdentityArt theme={theme} className={styles.art} />}
      <div className={styles.halfText}>
        <span className={styles.label}>{label}</span>
        <span className={styles.name}>{name}</span>
        <span className={styles.stat}>{stat}</span>
      </div>
      {!vertical && <IdentityArt theme={theme} className={styles.art} />}
    </div>
  );
}

function EmptyHalf({
  vertical,
  label,
  name,
  stat,
}: {
  vertical: boolean;
  label: string;
  name: string;
  stat: string;
}) {
  return (
    <div
      className={[
        styles.half,
        styles.empty,
        vertical ? styles.vertical : styles.horizontal,
        styles.t,
      ].join(' ')}
    >
      <span className={styles.question} aria-hidden="true">
        ?
      </span>
      <div className={styles.halfText}>
        <span className={styles.label}>{label}</span>
        <span className={styles.emptyName}>{name}</span>
        <span className={styles.stat}>{stat}</span>
      </div>
    </div>
  );
}

/**
 * «Mi municipio y yo» (W-09c, template P9): the archetype of the municipality crossed with the
 * badge of the person, 30 headlines. Without answers the «yo» half waits for them.
 */
export function DuoCard({ archetype, badge, format = 'story', you, place, figure }: DuoCardProps) {
  useEffect(registerCardFonts, []);
  const story = format === 'story';
  const a = archetype ? ARCHETYPE_THEMES[archetype] : null;
  const b = badge ? BADGE_THEMES[badge] : null;
  // Each missing half says what completes it (DEF-26): the card never invents a municipality.
  const crossing =
    archetype && badge
      ? CROSSINGS[badge][archetype]
      : archetype
        ? {
            title: ARCHETYPES[archetype].toUpperCase(),
            phrase: 'Mi municipio ya tiene personalidad; falta la mía.',
          }
        : badge
          ? {
              title: BADGES[badge].toUpperCase(),
              phrase: 'Yo ya tengo mi insignia; falta mi municipio.',
            }
          : { title: 'MI MUNICIPIO Y YO', phrase: 'Faltan las dos mitades de la tarjeta.' };
  const vars = {
    '--duo-a': a ? a.accent : '#ffffff',
    '--duo-b': b ? b.accent : '#ffffff',
    '--duo-title': headlineSize(crossing.title, story ? 40 : 30, story ? 312 : 328),
  } as CSSProperties;
  const label =
    archetype && badge
      ? `Mi municipio y yo: ${crossing.title.replace('­', '')}. ${crossing.phrase} Mi municipio es «${ARCHETYPES[archetype]}»; yo, «${BADGES[badge]}».`
      : archetype
        ? `Mi municipio es «${ARCHETYPES[archetype]}». Falta tu insignia: responde «Sobre ti».`
        : badge
          ? `Soy «${BADGES[badge]}». Falta el arquetipo de mi municipio.`
          : 'Mi municipio y yo: faltan el arquetipo de tu municipio y tu insignia.';
  const aScale = (story ? 0.5 : 0.34) * (a?.uppercase ? 0.82 : 1);
  const bScale = b ? (story ? 0.5 : 0.38) * (b.nameSize < 52 ? 52 / b.nameSize : 1) : 1;
  return (
    <div className={[styles.container, styles[`${format}Box`]].join(' ')}>
      <figure className={[styles.duo, styles[format]].join(' ')} style={vars} aria-label={label}>
        <div className={[styles.row, styles.t].join(' ')}>
          <Logo on="dark" />
          <span className={styles.chip}>MI MUNICIPIO Y YO</span>
        </div>
        <div className={[styles.headline, styles.t].join(' ')}>
          <span className={styles.title}>{crossing.title}</span>
          <span className={styles.phrase}>{crossing.phrase}</span>
        </div>
        {story && <span className={styles.spacer} />}
        <div className={styles.halves}>
          {a && archetype ? (
            <Half
              theme={a}
              label={place ? 'MI MUNICIPIO ES…' : 'UN MUNICIPIO ES…'}
              name={ARCHETYPES[archetype]}
              nameScale={aScale}
              stat={
                figure
                  ? ARCHETYPE_STAT[archetype][story ? 1 : 0].replace(/[+−]?—\.— pts/, figure)
                  : 'Elige tu municipio'
              }
              vertical={!story}
            />
          ) : (
            <EmptyHalf
              vertical={!story}
              label="MI MUNICIPIO ES…"
              name={place ? 'Aún sin arquetipo' : 'Falta tu municipio'}
              stat={place ? 'Menos de 5 elecciones' : 'Elige tu municipio'}
            />
          )}
          {story && (
            <span className={styles.plus} aria-hidden="true">
              +
            </span>
          )}
          {b && badge ? (
            <Half
              theme={b}
              label="Y YO SOY…"
              name={BADGES[badge]}
              nameScale={bScale}
              stat={you ?? ''}
              vertical={!story}
            />
          ) : (
            <EmptyHalf
              vertical={!story}
              label="Y YO SOY…"
              name="Falta tu parte"
              stat="Responde «Sobre ti»"
            />
          )}
        </div>
        {story && <span className={styles.spacer} />}
        <span className={[styles.footer, styles.t].join(' ')}>
          Arquetipo: datos INE 2009–2024 · Insignia: según mis respuestas ·{' '}
          {place ? `${place} · ` : ''}
          {SITE}
        </span>
      </figure>
    </div>
  );
}
