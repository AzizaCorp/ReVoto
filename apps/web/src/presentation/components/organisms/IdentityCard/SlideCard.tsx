import { useEffect, type CSSProperties } from 'react';
import { Logo } from '../../atoms';
import { registerCardFonts } from './fonts';
import { SITE } from './site';
import { SLIDE_THEMES, type SlideThemeId } from './slideThemes';
import styles from './SlideCard.module.css';

export interface SlideCardBar {
  label: string;
  value: string;
  /** 0–1; null draws the row without a bar. */
  ratio: number | null;
  highlight?: boolean;
  /** RN-03: midterm bars are striped, presidential bars are solid. */
  kind?: 'presidential' | 'midterm';
}

export interface SlideCardProps {
  /** Screen the card belongs to: sets its palette. */
  theme: SlideThemeId;
  /** `story` 9:16 or `post` 1:1. */
  format?: 'story' | 'post';
  chip: string;
  kicker: string;
  figure: string;
  figureCaption: string;
  title: string;
  bars?: readonly SlideCardBar[];
  /** Territory of the figures (RN-10). */
  place: string;
  /** Period of the figures (RN-10). */
  period: string;
}

/** Bars that fit in the 1:1 card. */
const POST_BARS = 3;

/** «24.8 pts» → [«24.8», «pts»]: the unit is drawn smaller so the number can be big. */
export function splitFigure(figure: string): [string, string] {
  const m = /^([#+−-]?[\d.,]+)\s*(.*)$/u.exec(figure);
  return m ? [m[1]!, m[2]!] : [figure, ''];
}

/**
 * Card of a story screen (US-24), in the style of a yearly «wrapped» story: a bold palette per
 * screen, one big figure, one sentence and the bars behind it. Drawn on a 360 px grid like the
 * identity cards, so the PNG export (1080 px) keeps its proportions. Its text is readable here.
 */
export function SlideCard({
  theme,
  format = 'story',
  chip,
  kicker,
  figure,
  figureCaption,
  title,
  bars = [],
  place,
  period,
}: SlideCardProps) {
  useEffect(registerCardFonts, []);
  const t = SLIDE_THEMES[theme];
  const vars = {
    '--slide-bg': t.background,
    '--slide-ink': t.ink,
    '--slide-sub': t.sub,
    '--slide-accent': t.accent,
    '--slide-track': t.track,
    '--slide-chip': t.chip,
    '--slide-chip-ink': t.chipInk,
    '--slide-font': t.font,
    '--slide-weight': t.weight,
    '--slide-case': t.uppercase ? 'uppercase' : 'none',
    '--slide-figure': t.figureSize,
  } as CSSProperties;
  const [number, unit] = splitFigure(figure);
  const shown = format === 'post' ? (bars.length <= POST_BARS ? bars : []) : bars;
  const source = `Fuente: INE · Conteos Censales de Participación Ciudadana (CCPC) ${period}`;
  return (
    <div className={styles.container}>
      <figure
        className={[styles.card, styles[format]].join(' ')}
        style={vars}
        aria-label={`${kicker.replace('…', '')} ${figure} ${figureCaption}. ${title}. ${place}, ${period}.`}
      >
        <span className={styles.blob} aria-hidden="true" />
        <span className={styles.ring} aria-hidden="true" />
        <div className={styles.row}>
          <Logo on={t.logoOn} />
          <span className={styles.chip}>{chip}</span>
        </div>
        <span className={styles.kicker}>{kicker}</span>
        <span className={styles.figure}>
          {number}
          {unit && <small className={styles.unit}> {unit}</small>}
        </span>
        <span className={styles.caption}>{figureCaption}</span>
        <span className={styles.title}>{title}</span>
        <span className={styles.spacer} />
        {shown.length > 0 && (
          <ul className={styles.bars}>
            {shown.map((b) => (
              <li
                key={b.label}
                className={[
                  styles.bar,
                  b.highlight ? styles.highlight : '',
                  b.kind === 'midterm' ? styles.midterm : '',
                ].join(' ')}
              >
                <span className={styles.barLabel}>{b.label}</span>
                <b className={styles.barValue}>{b.value}</b>
                {b.ratio !== null && (
                  <span className={styles.track}>
                    <span
                      className={styles.fill}
                      style={{ width: `${Math.max(0, Math.min(1, b.ratio)) * 100}%` }}
                    />
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        <span className={styles.place}>
          {place} · {period}
        </span>
        <span className={styles.footer}>
          {format === 'story' ? `${source} · ${SITE}` : `INE · CCPC ${period} · ${SITE}`}
        </span>
      </figure>
    </div>
  );
}
