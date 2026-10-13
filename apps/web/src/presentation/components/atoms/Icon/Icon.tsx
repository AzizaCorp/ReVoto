import styles from './Icon.module.css';

/** Stroke paths (24 × 24, round caps), board C-01 «Icon». */
const PATHS = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 6l-6 6 6 6',
  chev: 'M9 6l6 6-6 6',
  chevl: 'M15 6l-6 6 6 6',
  chevd: 'M6 9l6 6 6-6',
  share: 'M7 17L17 7M9 7h8v8',
  info: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 11v5M12 8h.01',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 7.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  users:
    'M9 4.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2c2.1.6 3.5 2.6 3.5 5.8',
  user: 'M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7',
  calendar:
    'M6 5h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3zM3 10h18M8 3v4M16 3v4',
  chart: 'M5 20V11M11 20V5M17 20v-7M3 20h18',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  search: 'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14M20 20l-4-4',
  check: 'M5 12l5 5 9-10',
  download: 'M12 4v12M6 11l6 6 6-6M5 20h14',
  copy: 'M10 8h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zM16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2',
  redo: 'M4 12a8 8 0 1 0 2.4-5.7L4 8.5M4 4v4.5h4.5',
  close: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  home: 'M3 11l9-7 9 7M5 10v11h14V10',
  type: 'M4 18l4-12 4 12M5.5 14h5M14 18l3-8 3 8M15 15.5h4',
} as const;

export type IconName = keyof typeof PATHS;
export const ICON_NAMES = Object.keys(PATHS) as IconName[];

export interface IconProps {
  name: IconName;
  /** Size in px; by default it follows `--rv-icon-size`. */
  size?: number;
  strokeWidth?: number;
}

/** Decorative stroke icon (board C-01). It uses `currentColor` and is hidden from assistive tech. */
export function Icon({ name, size, strokeWidth = 2 }: IconProps) {
  return (
    <svg
      className={styles.icon}
      style={size ? { width: size, height: size } : undefined}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
