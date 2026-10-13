import type { ArchetypeId, BadgeId } from '@/domain';

/** Visual universe of an identity card (boards A1–A5 and I1–I6 of the design). */
export interface CardTheme {
  font: string;
  weight: number;
  italic: boolean;
  uppercase: boolean;
  /** Name size in px on the 360 px story card. */
  nameSize: number;
  background: string;
  ink: string;
  accent: string;
  sub: string;
  chip: string;
  chipInk: string;
  statColor: string;
  /** Logo for a dark or light background. */
  logoOn: 'dark' | 'light';
  /** Art drawn above the name. */
  art: ArchetypeId | 'I1' | 'I6';
}

export interface ArchetypeCopy {
  phrase: string;
  stat: string;
  statCaption: string;
}

const FRAUNCES = "'Fraunces', serif";
const BRICOLAGE = "'Bricolage Grotesque', sans-serif";

export const ARCHETYPE_THEMES: Record<ArchetypeId, CardTheme & ArchetypeCopy> = {
  A1: {
    font: FRAUNCES,
    weight: 900,
    italic: false,
    uppercase: false,
    nameSize: 58,
    background: 'radial-gradient(circle at 70% 30%, #1d6b4f 0%, #0f3d2e 55%, #08261c 100%)',
    ink: '#f4ffe0',
    accent: '#c6f432',
    sub: '#a9d8b8',
    chip: '#c6f432',
    chipInk: '#0f3d2e',
    statColor: '#c6f432',
    logoOn: 'dark',
    art: 'A1',
    phrase: 'Pase lo que pase, aquí se vota.',
    stat: '+—.— pts',
    statCaption: 'sobre el país, elección tras elección',
  },
  A2: {
    font: BRICOLAGE,
    weight: 800,
    italic: false,
    uppercase: false,
    nameSize: 62,
    background: 'linear-gradient(180deg, #ff4d1c 0%, #ff8a00 48%, #ffd23f 100%)',
    ink: '#2a0a00',
    accent: '#fff4d6',
    sub: '#5c1d00',
    chip: '#2a0a00',
    chipInk: '#ffd23f',
    statColor: '#2a0a00',
    logoOn: 'light',
    art: 'A2',
    phrase: 'Cada elección, un escalón más.',
    stat: '+—.— pts',
    statCaption: 'por década frente al país',
  },
  A3: {
    font: "'Unbounded', sans-serif",
    weight: 900,
    italic: false,
    uppercase: false,
    nameSize: 44,
    background: 'linear-gradient(160deg, #1b0638 0%, #3a0ca3 60%, #5a189a 100%)',
    ink: '#ffffff',
    accent: '#00e5ff',
    sub: '#c9b8ff',
    chip: '#00e5ff',
    chipInk: '#1b0638',
    statColor: '#00e5ff',
    logoOn: 'dark',
    art: 'A3',
    phrase: 'Aquí nunca se sabe qué viene.',
    stat: '—.— pts',
    statCaption: 'de variación entre una elección y otra',
  },
  A4: {
    font: "'Anton', sans-serif",
    weight: 400,
    italic: false,
    uppercase: true,
    nameSize: 52,
    background: 'radial-gradient(circle at 50% -10%, #23407a 0%, #0b1e3f 60%, #050f22 100%)',
    ink: '#fff8e1',
    accent: '#ffc93c',
    sub: '#9fb3d9',
    chip: '#ffc93c',
    chipInk: '#0b1e3f',
    statColor: '#ffc93c',
    logoOn: 'dark',
    art: 'A4',
    phrase: 'Cuando hay presidencial, se llena la urna.',
    stat: '+—.— pts',
    statCaption: 'extra en presidenciales frente al país',
  },
  A5: {
    font: "'DM Serif Display', serif",
    weight: 400,
    italic: true,
    uppercase: false,
    nameSize: 58,
    background: 'linear-gradient(180deg, #2d4a63 0%, #4f6d8a 55%, #f2a07b 100%)',
    ink: '#fff3ea',
    accent: '#ff8a65',
    sub: '#dbe6f0',
    chip: '#fff3ea',
    chipInk: '#2d4a63',
    statColor: '#fff3ea',
    logoOn: 'dark',
    art: 'A5',
    phrase: 'Viene bajando: tu voto pesa más.',
    stat: '−—.— pts',
    statCaption: 'por década frente al país',
  },
};

const fromArchetype = (id: ArchetypeId, nameSize: number, phrase: string) => {
  const a = ARCHETYPE_THEMES[id];
  const theme: CardTheme = {
    font: a.font,
    weight: a.weight,
    italic: a.italic,
    uppercase: a.uppercase,
    nameSize,
    background: a.background,
    ink: a.ink,
    accent: a.accent,
    sub: a.sub,
    chip: a.chip,
    chipInk: a.chipInk,
    statColor: a.statColor,
    logoOn: a.logoOn,
    art: a.art,
  };
  return { ...theme, phrase };
};

export const BADGE_THEMES: Record<BadgeId, CardTheme & { phrase: string }> = {
  I1: {
    font: BRICOLAGE,
    weight: 800,
    italic: false,
    uppercase: false,
    nameSize: 60,
    background: 'radial-gradient(circle at 25% 15%, #ffffff 0%, #fff4e6 55%, #ffd9ec 100%)',
    ink: '#171824',
    accent: '#ff2d94',
    sub: '#7a4b5f',
    chip: '#171824',
    chipInk: '#ffffff',
    statColor: '#ff2d94',
    logoOn: 'light',
    art: 'I1',
    phrase: 'Estrenaste credencial y tu voto ya se sumó.',
  },
  I2: fromArchetype('A1', 56, '3 de 3: no te pierdes una.'),
  I3: fromArchetype('A4', 52, 'Cuando se elige presidencia, ahí estás.'),
  I4: fromArchetype('A2', 62, 'Tu voto más reciente fue el de 2024: vas en subida.'),
  I5: fromArchetype('A3', 42, 'Votas a tu ritmo.'),
  I6: {
    font: FRAUNCES,
    weight: 700,
    italic: true,
    uppercase: false,
    nameSize: 56,
    background: 'linear-gradient(180deg, #e9fff4 0%, #c8f5df 60%, #9fe8c8 100%)',
    ink: '#0d3b2e',
    accent: '#00a37a',
    sub: '#2f6b58',
    chip: '#0d3b2e',
    chipInk: '#e9fff4',
    statColor: '#00a37a',
    logoOn: 'light',
    art: 'I6',
    phrase: 'Tu próximo voto cuenta igual que todos.',
  },
};
