import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { ARCHETYPES, BADGES, type ArchetypeId, type BadgeId } from '@/domain';
import { Logo } from '../../atoms';
import { registerCardFonts } from './fonts';
import { IdentityArt } from './IdentityArt';
import { ARCHETYPE_THEMES, BADGE_THEMES, MYSTERY_THEME, type CardTheme } from './themes';
import styles from './IdentityCard.module.css';

/** `story` 9:16, `post` 1:1, `hero` the compact card of the mobile screens (W-09, W-09b). */
export type CardFormat = 'story' | 'post' | 'hero';

interface FrameProps {
  theme: CardTheme;
  format: CardFormat;
  chip: string;
  kicker: string;
  name: string;
  label: string;
  phrase: string;
  /** Name scale on the hero card (design: .56, .48 for Anton). */
  heroScale: number;
  children: ReactNode;
}

/** Shared skeleton: 9:16 story or 1:1 post, drawn at 360 px and scaled with the container. */
function CardFrame({
  theme,
  format,
  chip,
  kicker,
  name,
  label,
  phrase,
  heroScale,
  children,
}: FrameProps) {
  useEffect(registerCardFonts, []);
  const vars = {
    '--card-bg': theme.background,
    '--card-ink': theme.ink,
    '--card-sub': theme.sub,
    '--card-chip': theme.chip,
    '--card-chip-ink': theme.chipInk,
    '--card-stat': theme.statColor,
    '--card-font': theme.font,
    '--card-weight': theme.weight,
    '--card-style': theme.italic ? 'italic' : 'normal',
    '--card-case': theme.uppercase ? 'uppercase' : 'none',
    '--card-name': theme.nameSize,
    '--card-hero': heroScale,
  } as CSSProperties;
  const hero = format === 'hero';
  return (
    <div className={[styles.container, styles[`${format}Box`]].join(' ')}>
      <figure className={[styles.card, styles[format]].join(' ')} style={vars} aria-label={label}>
        <div className={[styles.row, styles.t].join(' ')}>
          {hero ? <span className={styles.kicker}>{kicker}</span> : <Logo on={theme.logoOn} />}
          <span className={styles.chip}>{chip}</span>
        </div>
        <IdentityArt theme={theme} className={[styles.art, styles.t].join(' ')} />
        {!hero && <span className={[styles.kicker, styles.t].join(' ')}>{kicker}</span>}
        <span className={[styles.name, styles.t].join(' ')}>{name}</span>
        {format !== 'post' && <span className={[styles.phrase, styles.t].join(' ')}>{phrase}</span>}
        <span className={styles.spacer} />
        {children}
      </figure>
    </div>
  );
}

export interface ArchetypeCardProps {
  archetype: ArchetypeId;
  format?: CardFormat;
  /** «[Municipio], [Entidad]» until the territory is chosen. */
  place?: string;
  /** Formatted figure of the archetype, e.g. «+3.2 pts». */
  stat?: string;
}

/** Municipality archetype card A1–A5 (RF-11), as drawn in the design. */
export function ArchetypeCard({
  archetype,
  format = 'story',
  place = '[Municipio], [Entidad]',
  stat,
}: ArchetypeCardProps) {
  const t = ARCHETYPE_THEMES[archetype];
  const name = ARCHETYPES[archetype];
  return (
    <CardFrame
      theme={t}
      format={format}
      chip={format === 'story' ? 'TU ARQUETIPO · 2009–2024' : '2009–2024'}
      kicker={`${place.split(',')[0]!.toUpperCase()} ES…`}
      name={name}
      label={`Arquetipo de ${place}: ${name}. ${t.phrase}`}
      phrase={t.phrase}
      heroScale={t.uppercase ? 0.48 : 0.56}
    >
      <div className={[styles.stat, styles.t].join(' ')}>
        <b>{stat ?? t.stat}</b>
        <span>{t.statCaption}</span>
      </div>
      {format === 'story' && <span className={[styles.place, styles.t].join(' ')}>{place}</span>}
      {format !== 'hero' && (
        <span className={[styles.footer, styles.t].join(' ')}>
          {format === 'story'
            ? 'Fuente: INE, conteos censales 2009–2024 · arquetipo calculado por ReVoto · [dominio]'
            : `${place} · Fuente: INE · [dominio]`}
        </span>
      )}
    </CardFrame>
  );
}

export interface BadgeCardProps {
  /** `null` while «Sobre ti» is unanswered: the card invites to answer. */
  badge: BadgeId | null;
  format?: CardFormat;
  /** Votes of the person, e.g. «2 de 3». */
  you?: string;
  /** Average of their generation in their state, e.g. «1.8 de 3». */
  generation?: string;
  entity?: string;
  /** Short comparison, e.g. «Al ritmo de tu generación». */
  pace?: string;
}

/** Personal badge card I1–I6, as drawn in the design. */
export function BadgeCard({
  badge,
  format = 'story',
  you = '— de 3',
  generation = '—.— de 3',
  entity = '[Entidad]',
  pace = '[Al ritmo de tu generación]',
}: BadgeCardProps) {
  if (!badge) {
    return (
      <CardFrame
        theme={MYSTERY_THEME}
        format={format}
        chip="TU INSIGNIA"
        kicker="AÚN SIN INSIGNIA"
        name="¿Cuál es la tuya?"
        label={`Aún no tienes insignia. ${MYSTERY_THEME.phrase}`}
        phrase={MYSTERY_THEME.phrase}
        heroScale={0.62}
      >
        <span className={[styles.pace, styles.t].join(' ')}>Responde «Sobre ti»: 4 toques.</span>
        {format !== 'hero' && (
          <span className={[styles.footer, styles.t].join(' ')}>
            Tus respuestas se quedan en tu teléfono: no las guardamos ni las enviamos.
          </span>
        )}
      </CardFrame>
    );
  }
  const t = BADGE_THEMES[badge];
  const name = BADGES[badge];
  return (
    <CardFrame
      theme={t}
      format={format}
      chip={format === 'story' ? 'TU INSIGNIA · 2018–2024' : 'TU INSIGNIA'}
      kicker="ERES…"
      name={name}
      label={`Tu insignia: ${name}. ${t.phrase} Tú: ${you}; tu generación en ${entity}: ${generation}.`}
      phrase={t.phrase}
      heroScale={t.uppercase ? 0.5 : 0.58}
    >
      {format === 'hero' ? (
        <span className={[styles.footer, styles.t].join(' ')}>Insignia según tus respuestas</span>
      ) : (
        <div className={[styles.compare, styles.t].join(' ')}>
          <span>TÚ</span>
          <span>TU GENERACIÓN EN {entity.toUpperCase()}</span>
          <b>{you}</b>
          <b className={styles.generation}>{generation}</b>
        </div>
      )}
      {format === 'story' && <span className={[styles.pace, styles.t].join(' ')}>{pace}</span>}
      {format !== 'hero' && (
        <span className={[styles.footer, styles.t].join(' ')}>
          {format === 'story'
            ? `Insignia según tus respuestas · ${entity} · Comparación: INE, participación por edad 2018–2024 · [dominio]`
            : `Insignia según tus respuestas · ${entity} · Comparación: INE · [dominio]`}
        </span>
      )}
    </CardFrame>
  );
}
