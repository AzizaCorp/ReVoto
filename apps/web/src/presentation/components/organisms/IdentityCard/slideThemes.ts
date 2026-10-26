/** Visual universe of a story-screen card (US-24): one bold palette per screen, «wrapped» style. */
export interface SlideTheme {
  background: string;
  ink: string;
  sub: string;
  /** Big figure, bars and decorative shapes. */
  accent: string;
  /** Track of the bars. */
  track: string;
  chip: string;
  chipInk: string;
  font: string;
  weight: number;
  uppercase: boolean;
  /** Size of the big figure on the 360 px story card. */
  figureSize: number;
  logoOn: 'dark' | 'light';
}

export type SlideThemeId = 'W-03' | 'W-04' | 'W-05' | 'W-06' | 'W-07' | 'W-08' | 'W-10';

const ANTON = "'Anton', sans-serif";
const UNBOUNDED = "'Unbounded', sans-serif";
const BRICOLAGE = "'Bricolage Grotesque', sans-serif";
const FRAUNCES = "'Fraunces', serif";

export const SLIDE_THEMES: Record<SlideThemeId, SlideTheme> = {
  'W-03': {
    background: 'radial-gradient(circle at 85% 12%, #5d1b6d 0%, #171824 58%)',
    ink: '#ffffff',
    sub: '#ffc2df',
    accent: '#ff2d94',
    track: 'rgba(255,255,255,.16)',
    chip: '#ff2d94',
    chipInk: '#171824',
    font: UNBOUNDED,
    weight: 900,
    uppercase: false,
    figureSize: 84,
    logoOn: 'dark',
  },
  'W-04': {
    background: 'linear-gradient(160deg, #ff4fa6 0%, #ff2d94 45%, #c8106e 100%)',
    ink: '#171824',
    sub: '#3d0a24',
    accent: '#ffffff',
    track: 'rgba(23,24,36,.18)',
    chip: '#171824',
    chipInk: '#ffffff',
    font: ANTON,
    weight: 400,
    uppercase: true,
    figureSize: 118,
    logoOn: 'light',
  },
  'W-05': {
    background: 'linear-gradient(180deg, #5d1b6d 0%, #3b0f47 100%)',
    ink: '#fff7e0',
    sub: '#e6c7ef',
    accent: '#ffd23f',
    track: 'rgba(255,255,255,.16)',
    chip: '#ffd23f',
    chipInk: '#3b0f47',
    font: BRICOLAGE,
    weight: 800,
    uppercase: false,
    figureSize: 92,
    logoOn: 'dark',
  },
  'W-06': {
    background: 'linear-gradient(170deg, #d7ff4f 0%, #c6f432 55%, #9fd418 100%)',
    ink: '#171824',
    sub: '#2f3a08',
    accent: '#933d82',
    track: 'rgba(23,24,36,.16)',
    chip: '#933d82',
    chipInk: '#ffffff',
    font: UNBOUNDED,
    weight: 900,
    uppercase: false,
    figureSize: 80,
    logoOn: 'light',
  },
  'W-07': {
    background: 'linear-gradient(180deg, #ff8a00 0%, #ff4d1c 100%)',
    ink: '#2a0a00',
    sub: '#4d1600',
    accent: '#fff3d6',
    track: 'rgba(42,10,0,.18)',
    chip: '#2a0a00',
    chipInk: '#ffd9a8',
    font: FRAUNCES,
    weight: 900,
    uppercase: false,
    figureSize: 96,
    logoOn: 'light',
  },
  'W-08': {
    background: 'radial-gradient(circle at 15% 90%, #4b3ad6 0%, #2d2aa8 45%, #17146b 100%)',
    ink: '#ffffff',
    sub: '#cfd0ff',
    accent: '#ff8cc6',
    track: 'rgba(255,255,255,.16)',
    chip: '#ff8cc6',
    chipInk: '#17146b',
    font: ANTON,
    weight: 400,
    uppercase: true,
    figureSize: 150,
    logoOn: 'dark',
  },
  'W-10': {
    background: 'linear-gradient(155deg, #ff2d94 0%, #933d82 50%, #2a0e3a 100%)',
    ink: '#ffffff',
    sub: '#ffd6ea',
    accent: '#ffd23f',
    track: 'rgba(255,255,255,.18)',
    chip: '#ffd23f',
    chipInk: '#2a0e3a',
    font: UNBOUNDED,
    weight: 900,
    uppercase: false,
    figureSize: 84,
    logoOn: 'dark',
  },
};
