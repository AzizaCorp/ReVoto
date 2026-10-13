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
  archetype: ArchetypeId;
  /** `null` while «Sobre ti» is unanswered: the «yo» half is an empty slot. */
  badge: BadgeId | null;
  /** 9:16 story or 1:1 post (the compact card of the mobile screen). */
  format?: 'story' | 'post';
  /** Line of the person, e.g. «2 de 3 · tu generación en [Entidad]: —.— de 3». */
  you?: string;
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

function EmptyHalf({ vertical }: { vertical: boolean }) {
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
        <span className={styles.label}>Y YO SOY…</span>
        <span className={styles.emptyName}>Falta tu parte</span>
        <span className={styles.stat}>Responde «Sobre ti»</span>
      </div>
    </div>
  );
}

/**
 * «Mi municipio y yo» (W-09c, template P9): the archetype of the municipality crossed with the
 * badge of the person, 30 headlines. Without answers the «yo» half waits for them.
 */
export function DuoCard({
  archetype,
  badge,
  format = 'story',
  you,
  place = '[Municipio], [Entidad]',
  figure,
}: DuoCardProps) {
  useEffect(registerCardFonts, []);
  const story = format === 'story';
  const a = ARCHETYPE_THEMES[archetype];
  const b = badge ? BADGE_THEMES[badge] : null;
  const crossing = badge
    ? CROSSINGS[badge][archetype]
    : {
        title: ARCHETYPES[archetype].toUpperCase(),
        phrase: 'Mi municipio ya tiene personalidad; falta la mía.',
      };
  const vars = {
    '--duo-a': a.accent,
    '--duo-b': b ? b.accent : '#ffffff',
    '--duo-title': headlineSize(crossing.title, story ? 40 : 30, story ? 312 : 328),
  } as CSSProperties;
  const label = badge
    ? `Mi municipio y yo: ${crossing.title.replace('­', '')}. ${crossing.phrase} Mi municipio es «${ARCHETYPES[archetype]}»; yo, «${BADGES[badge]}».`
    : `Mi municipio es «${ARCHETYPES[archetype]}». Falta tu insignia: responde «Sobre ti».`;
  const aScale = (story ? 0.5 : 0.34) * (a.uppercase ? 0.82 : 1);
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
          <Half
            theme={a}
            label="MI MUNICIPIO ES…"
            name={ARCHETYPES[archetype]}
            nameScale={aScale}
            stat={
              figure
                ? ARCHETYPE_STAT[archetype][story ? 1 : 0].replace(/[+−]?—\.— pts/, figure)
                : ARCHETYPE_STAT[archetype][story ? 1 : 0]
            }
            vertical={!story}
          />
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
              stat={you ?? '— de 3 · tu gen. —.—'}
              vertical={!story}
            />
          ) : (
            <EmptyHalf vertical={!story} />
          )}
        </div>
        {story && <span className={styles.spacer} />}
        <span className={[styles.footer, styles.t].join(' ')}>
          Arquetipo: datos INE 2009–2024 · Insignia: según mis respuestas · {place} · {SITE}
        </span>
      </figure>
    </div>
  );
}
